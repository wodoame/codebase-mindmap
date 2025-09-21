import { deleteNodeById, ExtendedHierarchyNode, getFullTree, getMindMapId } from "./tree-test";
import { getEditor } from "./editor";
import { treeManager } from "./tree-test";
import { componentManager } from "./managers";
import { ToastManager } from "./toast";
import { fetchJSONData } from "./utils";
import { data } from "alpinejs";


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
    private pendingDeleteNode: ExtendedHierarchyNode | null = null;

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
        console.log('Editor content set to:', node.data.HTML || '');
        getEditor()?.setHTML(node.data.HTML || '');
        this.modal.open();
    }

    async save(){
        if(this.activeNode){
            this.activeNode.data.HTML = getEditor()?.getHTML();
            const mindMapId = getMindMapId();
            const response = await fetchJSONData(`/api/mindmaps/${mindMapId}/`, {
                method: 'PATCH',
                data: { data : getFullTree()}
            });
        }
    }
    
    openAddChildForm(){
        componentManager.getInstance('fe-add-node')?.open();
    }

    openSetLinkForm(){
        componentManager.getInstance('fe-set-link')?.open();
    }

    openEditNodeForm(){
        componentManager.getInstance('fe-edit-node')?.open();
        // After the overlay is visible, prefill the input with current node name
        const nameInput = document.getElementById('new-name') as HTMLInputElement;
        nameInput.value = this.activeNode?.data.name || '';
        nameInput.select();
    }

    editNode(){
        if(this.activeNode){
            const form = document.getElementById('edit-node-form') as HTMLFormElement;
            if(form.checkValidity()){
                const formData = new FormData(form);
                const newName = String(formData.get('new_name')).trim();
                const dataFields = this.df.getFields();
                treeManager.updateNode(this.activeNode, { name: newName });
                dataFields.title.textContent = newName;
                ToastManager.success('Node edited successfully');
                componentManager.getInstance('fe-edit-node')?.close();
                form.reset();
            }
            else{
                form.reportValidity();
            }
        }
    }

    setLink(url: string){
        const form = document.getElementById('set-link-form') as HTMLFormElement;
        if(form.checkValidity()){
            getEditor()?.setLink(url);
            componentManager.getInstance('fe-set-link')?.close();
            ToastManager.success('Link set successfully');
            form.reset(); 
        }
        else{
            form.reportValidity();
        }

    }

    addChildNode(){
        if(this.activeNode){
            const form = document.getElementById('add-node-form') as HTMLFormElement;
            if(form.checkValidity()){
                const formData = new FormData(form);
                const nodeName = String(formData.get('node_name') ?? '').trim();
                treeManager.addNode(this.activeNode, nodeName);
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
        // Backward-compat: immediate delete (kept if called directly)
        if(this.activeNode){
            if(this.activeNode.data.id){
                const isDeleted = deleteNodeById(this.activeNode.data.id);
                if(isDeleted){
                    ToastManager.success('Node deleted successfully');
                } else {
                    ToastManager.error('Failed to delete node');
                }
                this.close();
            } else {
                ToastManager.error('This node has no id');
            }
        }
    }

    // Confirm delete flow
    openConfirmDelete(){
        if(!this.activeNode){
            ToastManager.error('No active node selected');
            return;
        }
        this.pendingDeleteNode = this.activeNode;
        componentManager.getInstance('fe-confirm-delete')?.open();
    }

    cancelConfirmDelete(){
        this.pendingDeleteNode = null;
        componentManager.getInstance('fe-confirm-delete')?.close();
    }

    confirmDelete(){
        const node = this.pendingDeleteNode;
        if(!node){
            ToastManager.error('Nothing to delete');
            return;
        }
        if(!node.data.id){
            ToastManager.error('This node has no id');
            return;
        }

        const isDeleted = deleteNodeById(node.data.id);
        if(isDeleted){
            ToastManager.success('Node deleted successfully');
        } else {
            ToastManager.error('Failed to delete node');
        }
        this.pendingDeleteNode = null;
        componentManager.getInstance('fe-confirm-delete')?.close();
        this.close();
    }
}


class DeleteMindmapModal extends BaseModal{
    private static instance: DeleteMindmapModal;

    static getInstance(): DeleteMindmapModal {
        if (!this.instance) {
            this.instance = new DeleteMindmapModal('mindmap-delete-modal');
        }
        return this.instance;
    }

    show(id:string){
        const form = document.getElementById('mindmap-delete-form') as HTMLFormElement;
        form.action = `/maps/${id}/delete/`;
        this.open();
    }

    confirmDelete(){
        const form = document.getElementById('mindmap-delete-form') as HTMLFormElement;
        this.close();
        form.submit();
    }
}

const getEditorModal = () => EditorModal.getInstance();
const getDeleteMindmapModal = () => DeleteMindmapModal.getInstance();

window['getEditorModal'] = getEditorModal;
window['getDeleteMindmapModal'] = getDeleteMindmapModal;
export { modalManager, getEditorModal, getDeleteMindmapModal };