import { ExtendedHierarchyNode } from "./tree-test";
class ModalManager{
    modals:any; 
    currentlyOpenModal: ModalInstance | null;  // track the currently opened modal
    constructor(){
        this.modals = {}; // a store of created modals
        this.currentlyOpenModal = null;
    }

    createModal(id: string, modalInstance: ModalInstance){
        this.modals[id] = modalInstance; 
    }

    getModal(id: string){
        return this.modals[id];
    }


}

const modalManager = new ModalManager();

// link a modal with this class to control basic modal functionality
// The modal classes here are basically proxy classes for controlling the actual modal instance created using Alpine.js
class BaseModal{
   modal: ModalInstance;
   constructor(id: string){
        this.modal = modalManager.getModal(id);
   }
   open(){
      this.modal.open();
   }
   
   close(){
      this.modal.close();
   }
}

class DataFields{
     // data fields 
     dataFields: {[key: string]: HTMLElement} = {};
     setDataField(key:string, value:HTMLElement){
         this.dataFields[key] = value;
     }
 };

class FormFields{
    // form fields 
    formFields: {[key: string]: HTMLInputElement} = {};

    setFormField(key: string, value:HTMLInputElement){
         this.formFields[key] = value; 
    }
}

class EditorModal extends BaseModal{
    df: DataFields;
    constructor(id:string, df: DataFields){
        super(id);
        this.df = df; 
    }
    show(node: ExtendedHierarchyNode){
        const dataFields = this.df.dataFields;
        dataFields.title.textContent = node.data.name;;
        this.modal.open();
    }
}

const getEditorModal = (()=>{
    let instance: EditorModal | undefined = undefined; 
    return ()=>{
        if(instance){
            return instance; 
        }
        const df = new DataFields();
        instance = new EditorModal('editor-modal', df);
        return instance;
    };
})();

window['getEditorModal'] = getEditorModal; // make it globally accessible for now
export { modalManager, getEditorModal };