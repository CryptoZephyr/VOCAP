use snforge_std::{
    declare, start_cheat_caller_address, stop_cheat_caller_address, ContractClassTrait,
    DeclareResultTrait,
};
use starknet::{contract_address_const, ContractAddress};
use vocap_contracts::{
    CapabilityPolicy, IVocapRouterDispatcher, IVocapRouterDispatcherTrait, LifecycleMode,
};

fn owner() -> ContractAddress {
    contract_address_const::<'OWNER'>()
}

fn pool() -> ContractAddress {
    contract_address_const::<'POOL'>()
}

fn user() -> ContractAddress {
    contract_address_const::<'USER'>()
}

#[starknet::interface]
trait IMockErc20<TState> {
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn mint(ref self: TState, recipient: ContractAddress, amount: u256);
}

#[starknet::contract]
mod MockErc20 {
    use super::IMockErc20;
    use starknet::storage::{
        Map, StorageMapReadAccess, StoragePathEntry, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        balances: Map<ContractAddress, u256>,
        allowances: Map<(ContractAddress, ContractAddress), u256>,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl MockErc20Impl of super::IMockErc20<ContractState> {
        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.read(account)
        }

        fn allowance(
            self: @ContractState, owner: ContractAddress, spender: ContractAddress,
        ) -> u256 {
            self.allowances.read((owner, spender))
        }

        fn approve(
            ref self: ContractState, spender: ContractAddress, amount: u256,
        ) -> bool {
            self.allowances.entry((get_caller_address(), spender)).write(amount);
            true
        }

        fn transfer(
            ref self: ContractState, recipient: ContractAddress, amount: u256,
        ) -> bool {
            self.move_tokens(get_caller_address(), recipient, amount);
            true
        }

        fn transfer_from(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool {
            let caller = get_caller_address();
            let allowance = self.allowances.read((sender, caller));
            assert(allowance >= amount, 'INSUFFICIENT_ALLOWANCE');
            self.allowances.entry((sender, caller)).write(allowance - amount);
            self.move_tokens(sender, recipient, amount);
            true
        }

        fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            let current = self.balances.read(recipient);
            self.balances.entry(recipient).write(current + amount);
        }
    }

    #[generate_trait]
    impl MockErc20Internal of MockErc20InternalTrait {
        fn move_tokens(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) {
            let sender_balance = self.balances.read(sender);
            assert(sender_balance >= amount, 'INSUFFICIENT_BALANCE');
            self.balances.entry(sender).write(sender_balance - amount);
            let recipient_balance = self.balances.read(recipient);
            self.balances.entry(recipient).write(recipient_balance + amount);
        }
    }
}

#[starknet::interface]
trait IMockTarget<TState> {
    fn execute(ref self: TState, token: ContractAddress, amount: u128, behavior: felt252);
    fn get_calls(self: @TState) -> u64;
}

#[starknet::contract]
mod MockTarget {
    use super::{IMockErc20Dispatcher, IMockErc20DispatcherTrait, IMockTarget};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address, get_contract_address};

    #[storage]
    struct Storage {
        router: ContractAddress,
        calls: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, router: ContractAddress) {
        self.router.write(router);
    }

    #[abi(embed_v0)]
    impl MockTargetImpl of super::IMockTarget<ContractState> {
        fn execute(
            ref self: ContractState, token: ContractAddress, amount: u128, behavior: felt252,
        ) {
            assert(get_caller_address() == self.router.read(), 'ONLY_ROUTER');
            self.calls.write(self.calls.read() + 1);
            if behavior == 2 {
                panic(array!['TARGET_REVERT']);
            }
            if behavior == 1 {
                let token_dispatcher = IMockErc20Dispatcher { contract_address: token };
                let value = u256 { low: amount, high: 0 };
                token_dispatcher.transfer_from(
                    self.router.read(), get_contract_address(), value,
                );
                token_dispatcher.transfer(self.router.read(), value);
            }
            if behavior == 3 {
                let token_dispatcher = IMockErc20Dispatcher { contract_address: token };
                token_dispatcher.transfer_from(
                    self.router.read(), get_contract_address(), u256 { low: amount, high: 0 },
                );
            }
        }

        fn get_calls(self: @ContractState) -> u64 {
            self.calls.read()
        }
    }
}

#[starknet::interface]
trait IMockPool<TState> {
    fn set_config(
        ref self: TState,
        router: ContractAddress,
        policy_id: felt252,
        token: ContractAddress,
        amount: u128,
        note_id: felt252,
    );
    fn reenter(ref self: TState);
}

#[starknet::contract]
mod MockPool {
    use super::IMockPool;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address};
    use vocap_contracts::{IVocapRouterDispatcher, IVocapRouterDispatcherTrait};

    #[storage]
    struct Storage {
        router: ContractAddress,
        policy_id: felt252,
        token: ContractAddress,
        amount: u128,
        note_id: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl MockPoolImpl of super::IMockPool<ContractState> {
        fn set_config(
            ref self: ContractState,
            router: ContractAddress,
            policy_id: felt252,
            token: ContractAddress,
            amount: u128,
            note_id: felt252,
        ) {
            self.router.write(router);
            self.policy_id.write(policy_id);
            self.token.write(token);
            self.amount.write(amount);
            self.note_id.write(note_id);
        }

        fn reenter(ref self: ContractState) {
            let router = IVocapRouterDispatcher { contract_address: self.router.read() };
            router.privacy_invoke(
                self.policy_id.read(),
                self.token.read(),
                self.amount.read(),
                self.note_id.read(),
                get_caller_address(),
                selector!("reenter"),
                array![].span(),
            );
        }
    }
}

fn deploy_erc20() -> ContractAddress {
    let contract = declare("MockErc20").unwrap().contract_class();
    let (address, _) = contract.deploy(@array![]).unwrap();
    address
}

fn deploy_target(router: ContractAddress) -> ContractAddress {
    let contract = declare("MockTarget").unwrap().contract_class();
    let (address, _) = contract.deploy(@array![router.into()]).unwrap();
    address
}

fn deploy_pool() -> ContractAddress {
    let contract = declare("MockPool").unwrap().contract_class();
    let (address, _) = contract.deploy(@array![]).unwrap();
    address
}

fn deploy_router(pool: ContractAddress) -> ContractAddress {
    let contract = declare("VocapRouter").unwrap().contract_class();
    let (address, _) = contract.deploy(@array![owner().into(), pool.into()]).unwrap();
    address
}

fn create_policy(
    router_address: ContractAddress,
    token: ContractAddress,
    amount: u128,
    target: ContractAddress,
    selector: felt252,
) -> felt252 {
    let router = IVocapRouterDispatcher { contract_address: router_address };
    start_cheat_caller_address(router_address, owner());
    let policy_id = router.create_policy(token, amount, target, selector);
    stop_cheat_caller_address(router_address);
    policy_id
}

fn invoke(
    router_address: ContractAddress,
    pool: ContractAddress,
    policy_id: felt252,
    token: ContractAddress,
    amount: u128,
    note_id: felt252,
    target: ContractAddress,
    selector: felt252,
    target_calldata: Span<felt252>,
) -> Span<vocap_contracts::OpenNoteDeposit> {
    let router = IVocapRouterDispatcher { contract_address: router_address };
    start_cheat_caller_address(router_address, pool);
    let result = router.privacy_invoke(
        policy_id, token, amount, note_id, target, selector, target_calldata,
    );
    stop_cheat_caller_address(router_address);
    result
}

#[test]
fn test_create_policy_and_reusable_return() {
    let token = deploy_erc20();
    let pool = pool();
    let router_address = deploy_router(pool);
    let target = deploy_target(router_address);
    let policy_id = create_policy(router_address, token, 1, target, selector!("execute"));
    let token_dispatcher = IMockErc20Dispatcher { contract_address: token };
    let router = IVocapRouterDispatcher { contract_address: router_address };
    let target_dispatcher = IMockTargetDispatcher { contract_address: target };

    token_dispatcher.mint(router_address, u256 { low: 1, high: 0 });
    let first = invoke(
        router_address,
        pool,
        policy_id,
        token,
        1,
        101,
        target,
        selector!("execute"),
        array![token.into(), 1, 1].span(),
    );
    assert(first.len() == 1, 'one return note expected');
    assert(*first[0].note_id == 101, 'wrong note id');
    assert(*first[0].token == token, 'wrong return token');
    assert(*first[0].amount == 1, 'wrong return amount');
    assert(target_dispatcher.get_calls() == 1, 'target should run once');
    assert(token_dispatcher.balance_of(router_address) == u256 { low: 1, high: 0 }, 'asset lost');
    assert(
        token_dispatcher.allowance(router_address, pool) == u256 { low: 1, high: 0 },
        'pool return allowance missing',
    );
    let policy: CapabilityPolicy = router.get_policy(policy_id);
    assert(policy.enabled, 'policy disabled unexpectedly');
    assert(policy.mode == LifecycleMode::Return, 'wrong lifecycle mode');

    start_cheat_caller_address(token, pool);
    token_dispatcher.transfer_from(router_address, pool, u256 { low: 1, high: 0 });
    stop_cheat_caller_address(token);
    token_dispatcher.mint(router_address, u256 { low: 1, high: 0 });
    let second = invoke(
        router_address,
        pool,
        policy_id,
        token,
        1,
        102,
        target,
        selector!("execute"),
        array![token.into(), 1, 0].span(),
    );
    assert(*second[0].note_id == 102, 'second return note missing');
    assert(target_dispatcher.get_calls() == 2, 'target should be reusable');
}

#[test]
#[should_panic(expected: "ONLY_POOL")]
fn test_direct_caller_bypass_rejected() {
    let token = deploy_erc20();
    let router_address = deploy_router(pool());
    let target = deploy_target(router_address);
    let policy_id = create_policy(router_address, token, 1, target, selector!("execute"));
    let router = IVocapRouterDispatcher { contract_address: router_address };
    start_cheat_caller_address(router_address, user());
    router.privacy_invoke(
        policy_id,
        token,
        1,
        101,
        target,
        selector!("execute"),
        array![token.into(), 1, 0].span(),
    );
}

#[test]
#[should_panic(expected: 'WRONG_TOKEN')]
fn test_wrong_token_rejected() {
    let token = deploy_erc20();
    let wrong_token = deploy_erc20();
    let router_address = deploy_router(pool());
    let target = deploy_target(router_address);
    let policy_id = create_policy(router_address, token, 1, target, selector!("execute"));
    let _ = invoke(
        router_address,
        pool(),
        policy_id,
        wrong_token,
        1,
        101,
        target,
        selector!("execute"),
        array![].span(),
    );
}

#[test]
#[should_panic(expected: 'WRONG_AMOUNT')]
fn test_wrong_amount_rejected() {
    let token = deploy_erc20();
    let router_address = deploy_router(pool());
    let target = deploy_target(router_address);
    let policy_id = create_policy(router_address, token, 1, target, selector!("execute"));
    let _ = invoke(
        router_address,
        pool(),
        policy_id,
        token,
        2,
        101,
        target,
        selector!("execute"),
        array![].span(),
    );
}

#[test]
fn test_unexpected_balance_does_not_block_execution() {
    let token = deploy_erc20();
    let router_address = deploy_router(pool());
    let target = deploy_target(router_address);
    let policy_id = create_policy(router_address, token, 1, target, selector!("execute"));
    let token_dispatcher = IMockErc20Dispatcher { contract_address: token };
    token_dispatcher.mint(router_address, u256 { low: 2, high: 0 });
    let returned = invoke(
        router_address,
        pool(),
        policy_id,
        token,
        1,
        101,
        target,
        selector!("execute"),
        array![token.into(), 1, 0].span(),
    );
    assert(returned.len() == 1, 'surplus must not block return');
    assert(*returned[0].amount == 1, 'wrong returned amount');
    assert(
        token_dispatcher.balance_of(router_address) == u256 { low: 2, high: 0 },
        'surplus lost',
    );
    assert(
        token_dispatcher.allowance(router_address, pool()) == u256 { low: 1, high: 0 },
        'pool return allowance missing',
    );
}

#[test]
#[should_panic(expected: 'WRONG_AMOUNT')]
fn test_stale_surplus_cannot_fund_next_invocation() {
    let token = deploy_erc20();
    let pool = deploy_pool();
    let router_address = deploy_router(pool);
    let target = deploy_target(router_address);
    let policy_id = create_policy(router_address, token, 1, target, selector!("execute"));
    let pool_dispatcher = IMockPoolDispatcher { contract_address: pool };
    pool_dispatcher.set_config(router_address, policy_id, token, 1, 101);
    let token_dispatcher = IMockErc20Dispatcher { contract_address: token };
    token_dispatcher.mint(router_address, u256 { low: 2, high: 0 });

    let _ = invoke(
        router_address,
        pool,
        policy_id,
        token,
        1,
        101,
        target,
        selector!("execute"),
        array![token.into(), 1, 0].span(),
    );
    start_cheat_caller_address(token, pool);
    token_dispatcher.transfer_from(router_address, pool, u256 { low: 1, high: 0 });
    stop_cheat_caller_address(token);

    let _ = invoke(
        router_address,
        pool,
        policy_id,
        token,
        1,
        102,
        target,
        selector!("execute"),
        array![token.into(), 1, 0].span(),
    );
}

#[test]
#[should_panic(expected: 'INVALID_SELECTOR')]
fn test_wrong_selector_rejected() {
    let token = deploy_erc20();
    let router_address = deploy_router(pool());
    let target = deploy_target(router_address);
    let policy_id = create_policy(router_address, token, 1, target, selector!("execute"));
    let _ = invoke(
        router_address,
        pool(),
        policy_id,
        token,
        1,
        101,
        target,
        selector!("get_calls"),
        array![].span(),
    );
}

#[test]
#[should_panic(expected: 'POLICY_DISABLED')]
fn test_disabled_policy_rejected() {
    let token = deploy_erc20();
    let router_address = deploy_router(pool());
    let target = deploy_target(router_address);
    let policy_id = create_policy(router_address, token, 1, target, selector!("execute"));
    let router = IVocapRouterDispatcher { contract_address: router_address };
    start_cheat_caller_address(router_address, owner());
    router.set_policy_enabled(policy_id, false);
    stop_cheat_caller_address(router_address);
    let _ = invoke(
        router_address,
        pool(),
        policy_id,
        token,
        1,
        101,
        target,
        selector!("execute"),
        array![].span(),
    );
}

#[test]
#[should_panic(expected: 'INVALID_TARGET')]
fn test_wrong_target_rejected() {
    let token = deploy_erc20();
    let router_address = deploy_router(pool());
    let target = deploy_target(router_address);
    let other_target = deploy_target(router_address);
    let policy_id = create_policy(router_address, token, 1, target, selector!("execute"));
    let _ = invoke(
        router_address,
        pool(),
        policy_id,
        token,
        1,
        101,
        other_target,
        selector!("execute"),
        array![].span(),
    );
}

#[test]
#[should_panic(expected: 'TARGET_CALL_FAILED')]
fn test_target_revert_fails_atomically() {
    let token = deploy_erc20();
    let router_address = deploy_router(pool());
    let target = deploy_target(router_address);
    let policy_id = create_policy(router_address, token, 1, target, selector!("execute"));
    let token_dispatcher = IMockErc20Dispatcher { contract_address: token };
    token_dispatcher.mint(router_address, u256 { low: 1, high: 0 });
    let _ = invoke(
        router_address,
        pool(),
        policy_id,
        token,
        1,
        101,
        target,
        selector!("execute"),
        array![token.into(), 1, 2].span(),
    );
}

#[test]
#[should_panic(expected: 'RETURN_FAILED')]
fn test_target_cannot_retain_capability_asset() {
    let token = deploy_erc20();
    let router_address = deploy_router(pool());
    let target = deploy_target(router_address);
    let policy_id = create_policy(router_address, token, 1, target, selector!("execute"));
    let token_dispatcher = IMockErc20Dispatcher { contract_address: token };
    token_dispatcher.mint(router_address, u256 { low: 1, high: 0 });
    let _ = invoke(
        router_address,
        pool(),
        policy_id,
        token,
        1,
        101,
        target,
        selector!("execute"),
        array![token.into(), 1, 3].span(),
    );
}

#[test]
#[should_panic(expected: 'RETURN_FAILED')]
fn test_target_cannot_retain_capability_asset_with_surplus() {
    let token = deploy_erc20();
    let router_address = deploy_router(pool());
    let target = deploy_target(router_address);
    let policy_id = create_policy(router_address, token, 1, target, selector!("execute"));
    let token_dispatcher = IMockErc20Dispatcher { contract_address: token };
    token_dispatcher.mint(router_address, u256 { low: 2, high: 0 });
    let _ = invoke(
        router_address,
        pool(),
        policy_id,
        token,
        1,
        101,
        target,
        selector!("execute"),
        array![token.into(), 1, 3].span(),
    );
}

#[test]
#[should_panic(expected: 'TARGET_CALL_FAILED')]
fn test_reentrant_target_cannot_reuse_capability() {
    let token = deploy_erc20();
    let pool = deploy_pool();
    let router_address = deploy_router(pool);
    let policy_id = create_policy(router_address, token, 1, pool, selector!("reenter"));
    let pool_dispatcher = IMockPoolDispatcher { contract_address: pool };
    pool_dispatcher.set_config(router_address, policy_id, token, 1, 101);
    let token_dispatcher = IMockErc20Dispatcher { contract_address: token };
    token_dispatcher.mint(router_address, u256 { low: 1, high: 0 });
    let _ = invoke(
        router_address,
        pool,
        policy_id,
        token,
        1,
        101,
        pool,
        selector!("reenter"),
        array![].span(),
    );
}
