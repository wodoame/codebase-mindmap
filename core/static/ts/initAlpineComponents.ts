import Alpine from 'alpinejs';
import { modalManager } from './modals';
import { selectedRect } from '@tiptap/pm/tables';
import { getDropdown } from './utils';

function createModalInstance(id: string){
    return {
        isOpen: false,
        init(){
            console.log(`Modal component with id ${id} initialized`);
            modalManager.createModal(id, this);
        },
        // functionalities defined here can be used in the components directly
        open(){
            this.isOpen = true;
            this.toggleSideEffects(!this.isOpen); 
            history.pushState(null, '');
            localStorage.setItem('modalOpen', 'true');
            modalManager.currentlyOpenModal = this;
        }, 
        close(){
            this.isOpen = false;
            this.toggleSideEffects(!this.isOpen);
            // no matter what closes the modal remove these from localStorage
            localStorage.removeItem('modalOpen');
            localStorage.removeItem('forwarded');
        },
        toggleSideEffects(force:boolean){
            const animatedBackdrop = document.getElementById('animated-backdrop');
            const body = document.body;
            animatedBackdrop!.classList.toggle('hidden', force); // note when force is true the class is added and if it's false it is removed
            body.classList.toggle('overflow-hidden', !force);
        }, 
        handleClickOutside(e: Event){
            if(e.target == e.currentTarget){
                this.close();
            }
        }
    }
}

function createSelectInstance(id: string){
    // This component dispatches a custom event 'option-selected' when an option is selected
    return {
        isOpen: false,
        selectedValue: undefined,
        options: [],
        init(){
            this.options = JSON.parse(
                (this.$refs.wrapper as HTMLElement
                ).dataset.options as string);
            this.selectedValue = this.options[0];
        },
        select(value:string){
            this.selectedValue = value;
            getDropdown('dropdown').hide(); // close the dropdown after selection
        }, 
        open(){
            this.isOpen = true;
        },
        close(){
            this.isOpen = false;
        }
    }
}

function handleAlpineInitialization(){
    Alpine.data('baseModal', createModalInstance);
    Alpine.data('select', createSelectInstance);
    // more stuff can be here to all be initialized at once
}

// initialize it with
document.addEventListener('alpine:init', handleAlpineInitialization);