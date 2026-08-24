use starknet::ContractAddress;

#[starknet::interface]
pub trait IVocapApprovedTarget<TContractState> {
    fn premium_action(ref self: TContractState);
    fn get_action_count(self: @TContractState) -> u64;
    fn get_router(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
mod VocapApprovedTarget {
    use core::num::traits::Zero;
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        router: ContractAddress,
        action_count: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, router: ContractAddress) {
        assert!(!router.is_zero(), "ROUTER_ZERO");
        self.router.write(router);
    }

    #[abi(embed_v0)]
    impl VocapApprovedTargetImpl of super::IVocapApprovedTarget<ContractState> {
        fn premium_action(ref self: ContractState) {
            // This mutation is intentionally public at the ABI level, but only the configured
            // VOCAP router may reach it so the policy remains the authorization boundary.
            assert!(get_caller_address() == self.router.read(), "ONLY_ROUTER");
            self.action_count.write(self.action_count.read() + 1);
        }

        fn get_action_count(self: @ContractState) -> u64 {
            self.action_count.read()
        }

        fn get_router(self: @ContractState) -> ContractAddress {
            self.router.read()
        }
    }
}
