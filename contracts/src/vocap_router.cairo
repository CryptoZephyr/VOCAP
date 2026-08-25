use starknet::ContractAddress;

/// Positional return type required by the STRK20 privacy pool's `privacy_invoke` path.
#[derive(Copy, Drop, Serde, PartialEq, Debug)]
pub struct OpenNoteDeposit {
    pub note_id: felt252,
    pub token: ContractAddress,
    pub amount: u128,
}

#[derive(Copy, Drop, Serde, starknet::Store, PartialEq, Debug)]
pub enum LifecycleMode {
    #[default]
    Return,
}

#[derive(Copy, Drop, Serde, starknet::Store, PartialEq, Debug)]
pub struct CapabilityPolicy {
    pub token: ContractAddress,
    pub amount: u128,
    pub target: ContractAddress,
    pub selector: felt252,
    pub enabled: bool,
    pub mode: LifecycleMode,
}

#[starknet::interface]
pub trait IVocapRouter<TState> {
    fn privacy_invoke(
        ref self: TState,
        policy_id: felt252,
        token: ContractAddress,
        amount: u128,
        note_id: felt252,
        target: ContractAddress,
        selector: felt252,
        target_calldata: Span<felt252>,
    ) -> Span<OpenNoteDeposit>;

    fn create_policy(
        ref self: TState,
        token: ContractAddress,
        amount: u128,
        target: ContractAddress,
        selector: felt252,
    ) -> felt252;

    fn set_policy_enabled(ref self: TState, policy_id: felt252, enabled: bool);

    fn get_policy(self: @TState, policy_id: felt252) -> CapabilityPolicy;
    fn get_owner(self: @TState) -> ContractAddress;
    fn get_pool(self: @TState) -> ContractAddress;
}

#[starknet::interface]
trait IERC20<TState> {
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}

mod errors {
    pub const ONLY_POOL: felt252 = 'ONLY_POOL';
    pub const ONLY_OWNER: felt252 = 'ONLY_OWNER';
    pub const POLICY_DISABLED: felt252 = 'POLICY_DISABLED';
    pub const INVALID_TOKEN: felt252 = 'INVALID_TOKEN';
    pub const INVALID_AMOUNT: felt252 = 'INVALID_AMOUNT';
    pub const INVALID_TARGET: felt252 = 'INVALID_TARGET';
    pub const INVALID_SELECTOR: felt252 = 'INVALID_SELECTOR';
    pub const INVALID_NOTE: felt252 = 'INVALID_NOTE';
    pub const WRONG_TOKEN: felt252 = 'WRONG_TOKEN';
    pub const WRONG_AMOUNT: felt252 = 'WRONG_AMOUNT';
    pub const TARGET_CALL_FAILED: felt252 = 'TARGET_CALL_FAILED';
    pub const RETURN_FAILED: felt252 = 'RETURN_FAILED';
    pub const TOKEN_CALL_FAILED: felt252 = 'TOKEN_CALL_FAILED';
    pub const REENTRANCY: felt252 = 'REENTRANCY';
}

#[starknet::contract]
mod VocapRouter {
    use super::{
        CapabilityPolicy, IERC20Dispatcher, IERC20DispatcherTrait, IVocapRouter, LifecycleMode,
        OpenNoteDeposit,
    };
    use super::errors;
    use core::num::traits::Zero;
    use starknet::storage::{
        Map, StorageMapReadAccess, StoragePathEntry, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::syscalls::call_contract_syscall;
    use starknet::{ContractAddress, get_caller_address, get_contract_address};

    #[storage]
    struct Storage {
        owner: ContractAddress,
        pool: ContractAddress,
        next_policy_id: felt252,
        policies: Map<felt252, CapabilityPolicy>,
        token_surplus: Map<ContractAddress, u256>,
        entered: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PolicyCreated: PolicyCreated,
        PolicyEnabled: PolicyEnabled,
        PolicyExecuted: PolicyExecuted,
    }

    #[derive(Drop, starknet::Event)]
    struct PolicyCreated {
        #[key]
        policy_id: felt252,
        token: ContractAddress,
        amount: u128,
        target: ContractAddress,
        selector: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct PolicyEnabled {
        #[key]
        policy_id: felt252,
        enabled: bool,
    }

    #[derive(Drop, starknet::Event)]
    struct PolicyExecuted {
        #[key]
        policy_id: felt252,
        target: ContractAddress,
        selector: felt252,
        token: ContractAddress,
        amount: u128,
        note_id: felt252,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, owner: ContractAddress, pool: ContractAddress,
    ) {
        assert(owner.is_non_zero(), errors::ONLY_OWNER);
        assert(pool.is_non_zero(), errors::ONLY_POOL);
        self.owner.write(owner);
        self.pool.write(pool);
        self.next_policy_id.write(1);
    }

    #[abi(embed_v0)]
    impl VocapRouterImpl of IVocapRouter<ContractState> {
        fn privacy_invoke(
            ref self: ContractState,
            policy_id: felt252,
            token: ContractAddress,
            amount: u128,
            note_id: felt252,
            target: ContractAddress,
            selector: felt252,
            target_calldata: Span<felt252>,
        ) -> Span<OpenNoteDeposit> {
            assert!(get_caller_address() == self.pool.read(), "ONLY_POOL");
            assert!(!self.entered.read(), "REENTRANCY");
            self.entered.write(true);

            let policy = self.policies.read(policy_id);
            assert(policy.enabled, errors::POLICY_DISABLED);
            assert(policy.mode == LifecycleMode::Return, errors::RETURN_FAILED);
            assert(token == policy.token, errors::WRONG_TOKEN);
            assert(amount == policy.amount, errors::WRONG_AMOUNT);
            assert(target == policy.target, errors::INVALID_TARGET);
            assert(selector == policy.selector, errors::INVALID_SELECTOR);
            assert(note_id.is_non_zero(), errors::INVALID_NOTE);

            let expected = u256 { low: policy.amount, high: 0 };
            let token_dispatcher = IERC20Dispatcher { contract_address: policy.token };
            let prior_surplus = self.token_surplus.read(policy.token);
            let received_balance = token_dispatcher.balance_of(get_contract_address());
            assert(received_balance >= expected, errors::WRONG_AMOUNT);
            assert(received_balance - expected >= prior_surplus, errors::WRONG_AMOUNT);

            assert(
                token_dispatcher.approve(policy.target, expected),
                errors::TOKEN_CALL_FAILED,
            );

            match call_contract_syscall(
                address: policy.target,
                entry_point_selector: policy.selector,
                calldata: target_calldata,
            ) {
                Result::Ok(_) => {},
                Result::Err(_) => panic(array![errors::TARGET_CALL_FAILED]),
            }

            let remaining_balance = token_dispatcher.balance_of(get_contract_address());
            assert(remaining_balance >= received_balance, errors::RETURN_FAILED);
            self.token_surplus.entry(policy.token).write(remaining_balance - expected);

            assert(
                token_dispatcher.approve(policy.target, u256 { low: 0, high: 0 }),
                errors::TOKEN_CALL_FAILED,
            );
            assert(
                token_dispatcher.approve(self.pool.read(), expected),
                errors::RETURN_FAILED,
            );

            self.entered.write(false);
            self.emit(PolicyExecuted {
                policy_id,
                target: policy.target,
                selector: policy.selector,
                token: policy.token,
                amount: policy.amount,
                note_id,
            });

            array![OpenNoteDeposit { note_id, token: policy.token, amount: policy.amount }].span()
        }

        fn create_policy(
            ref self: ContractState,
            token: ContractAddress,
            amount: u128,
            target: ContractAddress,
            selector: felt252,
        ) -> felt252 {
            assert!(get_caller_address() == self.owner.read(), "ONLY_OWNER");
            assert(token.is_non_zero(), errors::INVALID_TOKEN);
            assert(amount != 0, errors::INVALID_AMOUNT);
            assert(target.is_non_zero(), errors::INVALID_TARGET);
            assert(selector != 0, errors::INVALID_SELECTOR);

            let policy_id = self.next_policy_id.read();
            self.next_policy_id.write(policy_id + 1);
            self.policies.entry(policy_id).write(CapabilityPolicy {
                token,
                amount,
                target,
                selector,
                enabled: true,
                mode: LifecycleMode::Return,
            });
            self.emit(PolicyCreated { policy_id, token, amount, target, selector });
            policy_id
        }

        fn set_policy_enabled(
            ref self: ContractState, policy_id: felt252, enabled: bool,
        ) {
            assert!(get_caller_address() == self.owner.read(), "ONLY_OWNER");
            let policy = self.policies.read(policy_id);
            assert(policy.token.is_non_zero(), errors::POLICY_DISABLED);
            self.policies.entry(policy_id).write(CapabilityPolicy {
                token: policy.token,
                amount: policy.amount,
                target: policy.target,
                selector: policy.selector,
                enabled,
                mode: policy.mode,
            });
            self.emit(PolicyEnabled { policy_id, enabled });
        }

        fn get_policy(self: @ContractState, policy_id: felt252) -> CapabilityPolicy {
            self.policies.read(policy_id)
        }

        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        fn get_pool(self: @ContractState) -> ContractAddress {
            self.pool.read()
        }
    }
}
