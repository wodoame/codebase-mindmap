import { deleteNodeById, ExtendedHierarchyNode, getFullTree } from "./tree-test";
import { getEditor } from "./editor";
import { treeManager } from "./tree-test";
import { componentManager } from "./managers";
import { ToastManager } from "./toast";
import { fetchJSONData } from "./utils";


type ModalInstance = {
    toggleSideEffects: (force:boolean)=>void;
    open: ()=>void; 
    close: ()=>void; 
    isOpen: boolean; 
}
class ModalManager{
    private static instance: ModalManager;
    private modals: Map<string, ModalInstance> = new Map();
    currentlyOpenModal: ModalInstance | null;  // track the currently opened modal
    
    // constructor is private to enforce singleton pattern
    private constructor(){
        this.currentlyOpenModal = null;
    }

    static getInstance(): ModalManager {
        if (!ModalManager.instance) {
            ModalManager.instance = new ModalManager();
        }
        return ModalManager.instance;
    }

    registerModal(id: string, modalInstance: ModalInstance){
        this.modals.set(id, modalInstance);
    }

    getModal(id: string){
        return this.modals.get(id);
    }


}

const modalManager = ModalManager.getInstance();

// link a modal with this class to control basic modal functionality
// The modal classes here are basically proxy classes for controlling the actual modal instance created using Alpine.js
class BaseModal{
   modal: ModalInstance;
   constructor(id: string){
        this.modal = modalManager.getModal(id)!;
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
     private dataFields: Record<string, HTMLElement> = {};
     getFields(){
         return this.dataFields;
     }
     set(key:string, value:HTMLElement){
         this.dataFields[key] = value;
     }
 };

class FormFields{
    // form fields 
    private formFields: Record<string, HTMLInputElement> = {};
    getFields(){
        return this.formFields;
    }
    set(key: string, value:HTMLInputElement){
         this.formFields[key] = value; 
    }
}

class EditorModal extends BaseModal{
    private static instance: EditorModal;
    private df: DataFields;
    private activeNode: ExtendedHierarchyNode | null = null;

    private constructor(id:string, df: DataFields){
        super(id);
        this.df = df;
    }

    // Singleton
    static getInstance(): EditorModal {
        if (!EditorModal.instance) {
            const df = new DataFields();
            EditorModal.instance = new EditorModal("editor-modal", df);
        }
        return EditorModal.instance;
    }

    show(node: ExtendedHierarchyNode){
        this.activeNode = node;
        const dataFields = this.df.getFields();
        dataFields.title.textContent = node.data.name;
        getEditor()?.setHTML(node.data.HTML || '');
        this.modal.open();
    }

    async save(){
        if(this.activeNode){
            this.activeNode.data.HTML = getEditor()?.getHTML();
            const response = await fetchJSONData(`/api/mindmaps/1/`, {
                method: 'PATCH',
                data: { data : getFullTree()}
            });
            console.log(response);
        }
    }
    
    openAddChildForm(){
        componentManager.getInstance('fe-add-node')?.open();
    }
    addChildNode(){
        if(this.activeNode){
            const form = document.getElementById('add-node-form') as HTMLFormElement;
            if(form.checkValidity()){
                const values = window.htmx.values(form);
                console.log(values.node_name);
                treeManager.addNode(this.activeNode, values.node_name);
                ToastManager.success('Node created successfully');
                componentManager.getInstance('fe-add-node')?.close();
                form.reset();
            }
            else{
                form.reportValidity();
            }
        }
    }

    deleteNode(){
        if(this.activeNode){
            if(this.activeNode.data.id){
                const isDeleted = deleteNodeById(this.activeNode.data.id);
                if(isDeleted){
                    ToastManager.success('Node deleted successfully');
                }
                else{
                    ToastManager.error('Failed to delete node');
                }
                this.close();
            }
            else{
                ToastManager.error('This node has no id');
            }
        }
    }
}

const getEditorModal = () => EditorModal.getInstance();

declare global {
    interface Window {
        getEditorModal: () => EditorModal;
        htmx: {
            values: (form: HTMLFormElement) => any;
        };
    }
}

window.getEditorModal = getEditorModal;
export { modalManager, getEditorModal };