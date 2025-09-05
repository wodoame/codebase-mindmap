type ModalInstance = {
    toggleSideEffects: (force:boolean)=>void;
    open: ()=>void; 
    close: ()=>void; 
    isOpen: boolean; 
}