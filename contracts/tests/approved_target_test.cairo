use snforge_std::{
    declare, start_cheat_caller_address, stop_cheat_caller_address, ContractClassTrait,
    DeclareResultTrait,
};
use starknet::{contract_address_const, ContractAddress};
use vocap_contracts::{
    IVocapApprovedTargetDispatcher, IVocapApprovedTargetDispatcherTrait,
};

fn router() -> ContractAddress {
    contract_address_const::<'ROUTER'>()
}

fn user() -> ContractAddress {
    contract_address_const::<'USER'>()
}

fn deploy_target(configured_router: ContractAddress) -> ContractAddress {
    let contract = declare("VocapApprovedTarget").unwrap().contract_class();
    contract.deploy(@array![configured_router.into()]).unwrap().0
}

#[test]
fn test_constructor_and_router_state() {
    let target = deploy_target(router());
    let dispatcher = IVocapApprovedTargetDispatcher { contract_address: target };

    assert(dispatcher.get_router() == router(), 'wrong router');
    assert(dispatcher.get_action_count() == 0, 'wrong initial count');
}

#[test]
fn test_constructor_rejects_zero_router() {
    let contract = declare("VocapApprovedTarget").unwrap().contract_class();
    let result = contract.deploy(@array![0]);
    match result {
        Result::Ok(_) => panic(array!['ZERO_ROUTER_ACCEPTED']),
        Result::Err(_) => {}
    }
}

#[test]
// The dispatcher preserves ONLY_ROUTER in the nested panic data and exposes
// ENTRYPOINT_FAILED as the outer syscall failure.
#[should_panic(expected: ("ONLY_ROUTER", 'ENTRYPOINT_FAILED'))]
fn test_direct_action_rejected() {
    let target = deploy_target(router());
    let dispatcher = IVocapApprovedTargetDispatcher { contract_address: target };

    start_cheat_caller_address(target, user());
    dispatcher.premium_action();
    stop_cheat_caller_address(target);
}

#[test]
fn test_router_action_increments_count() {
    let target = deploy_target(router());
    let dispatcher = IVocapApprovedTargetDispatcher { contract_address: target };

    start_cheat_caller_address(target, router());
    dispatcher.premium_action();
    dispatcher.premium_action();
    stop_cheat_caller_address(target);

    assert(dispatcher.get_action_count() == 2, 'action count mismatch');
}
