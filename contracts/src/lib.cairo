pub mod vocap_router;
pub mod vocap_approved_target;

pub use vocap_router::{
    CapabilityPolicy, IVocapRouter, IVocapRouterDispatcher, IVocapRouterDispatcherTrait,
    LifecycleMode, OpenNoteDeposit,
};
pub use vocap_approved_target::{
    IVocapApprovedTarget, IVocapApprovedTargetDispatcher,
    IVocapApprovedTargetDispatcherTrait,
};
