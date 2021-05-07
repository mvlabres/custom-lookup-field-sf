import { LightningElement, api, track, wire } from 'lwc';
import getRecentRecords from '@salesforce/apex/LookupfieldController.getRecentRecords';
import searchRecords from '@salesforce/apex/LookupfieldController.searchRecords';
import getRecord from '@salesforce/apex/LookupfieldController.getRecord';
import SearchParameters from './searchParameters';
import id from '@salesforce/user/Id';
//import REQUIRED_FIELD from '@salesforce/label/c.REQUIRED_FIELD';

const DELAY = 500;
export default class LookupField extends LightningElement {
    Label = '*';//{REQUIRED_FIELD};
    @api name;
    @api isAttributeRequired;
    @api objectName;
    @api conditions = {};
    @api label;
    @api icon = 'standard:default';
    @api term = '';
    @api fieldLabel;
    @api fields = '';
    @api isDisabled;
    @api placeholder;
    @api fieldsToShow = [];
    @api fieldsToSearch = [];
    @api sortColumn = '';
    @api sortOrder = '';
    @api maxResults = 5;
    @api initialSearchLength = 3;
    @api loadRecentRecord = false;
    @api labelSelected;
    @api returnFields = [];
    
    @track records = ''
    @track recordById;
    @track isReadOnly;
    paramenters;

    @track selected = '';
    @track showRecordsListFlag = false;

    connectedCallback(){ 
        if ( this.loadRecentRecord )
            this.getRecent();

        if ( this.labelSelected && !this.selectedId )
            this.records = this.getLabelSelected();
    }

    @api
    get selectedId(){
        return this._selectedId;
    }

    set selectedId(selectedId){
        setTimeout(() => {
            this._selectedId = selectedId;
            this.checkSelected();
        }, 50);
    }

    buildSearchParameters(){
        this.parameters = new SearchParameters();
        this.parameters.id = this.selectedId;
        this.parameters.objectName = this.objectName;
        this.parameters.returnFields = this.returnFields;
        this.parameters.queryFields = this.fieldsToSearch;
        this.parameters.searchText = this.term;
        this.parameters.sortColumn = this.sortColumn;
        this.parameters.sortOrder = this.sortOrder;
        this.parameters.maxResults = this.maxResults;
        this.parameters.conditions = this.conditions;
    }

    checkSelected(){
        if( this.selectedId && this.selectedId != null && this.selectedId != '' ){
            this.buildSearchParameters();
            getRecord( { parameters:  this.parameters } )
            .then(result => {
                if( result ){

                    this.records = [].concat( JSON.parse(JSON.stringify(result)));
                    this.buildLabel();
                    this.selected = this.records[0].labelToShow;

                    this.addClass('.defaultClass', 'slds-hide');
                    this.removeClass('.selectedOption', 'slds-hide');
    
                    let detail = { id: this.value, 
                                   name: this.selected, 
                                   record: result[0]
                                 };
                    
                    this.dispatchCustomEvent( 'select', detail );
                }
               
            }).catch(
                error => {
                    console.error(error.body.message);
                }
            );
        }
    }

    @api
    deselectValue(){
        if(this.selected == '') return;
        this.removeSelectedOption();
    }
    
    handleKeyUp(event) {
        
        if (!event) return;

        if (!event.target) return;
        
        const searchKey = event.target.value;

        if ((event.keyCode === 229) && (!searchKey)) return;

        if (event.keyCode !== 229) { //prevents mobile chrome execution

            //prevent arrows changes on desktop

            const keyPressed = String.fromCharCode(event.keyCode);

            if (!(/[a-zA-Z0-9-_ ]/.test(keyPressed))) return;

        }
        this.showRecordsList(searchKey);
    }

    showRecordsList(searchKey){
        if (!this.showRecordsListFlag) {
            this.showRecordsListFlag = true;
            this.removeClass('.accounts_list', 'slds-hide');
            this.removeClass('.defaultClass', 'slds-hide');
        }

        if (this._timeoutKeyUp) clearTimeout(this._timeoutKeyUp);

        this._timeoutKeyUp = setTimeout(() => {
            this.term = searchKey;
            if ( searchKey.length >= this.initialSearchLength ) 
                this.findItemsByTerm();
        }, DELAY);
    }

    getLabelSelected(){
        this.selected = this.labelSelected;
        setTimeout(() => {
            this.addClass('.defaultClass', 'slds-hide');
            this.removeClass('.selectedOption', 'slds-hide');
        }, 300);
        return [{labelToShow: this.labelSelected, Id:''}];
    }

    getRecent(){
        this.buildSearchParameters();
        getRecentRecords( { parameters:  this.parameters } ).then(
            result => {
                if (result) {

                    this.records = [].concat( JSON.parse(JSON.stringify(result)));

                    this.buildLabel();

                    this.recordById = new Map(JSON.parse(JSON.stringify(result)).map(i => [i.Id, i]));
                }
            }           
        ).catch(
            error => {
                console.error(error.body.message);
            }
        );
    }

    findItemsByTerm( ){
        this.buildSearchParameters();
        searchRecords( { parameters:  this.parameters } ).then(
            result => {
                if (result) {

                    this.records = [].concat( JSON.parse(JSON.stringify(result)));

                    this.buildLabel();

                    this.recordById = new Map(JSON.parse(JSON.stringify(result)).map(i => [i.Id, i]));
                }
            }           
        ).catch(
            error => {
                console.error(error.body.message);
            }
        );
    }

    buildLabel(){

        let newObject = {};
        let newRecords = [];

        this.records.forEach(element => {

            newObject['labelToShow'] = ''

            if ( this.fieldsToShow.length > 0 ) {
                this.fieldsToShow.reduce((previous, item) => {
    
                    newObject.labelToShow += previous + this.getRecordFieldValue(element, item);
                    return ' - '
        
                },'');
            }else{
                newObject.labelToShow = element.Name;
            }
            
            newRecords.push(Object.assign( JSON.parse(JSON.stringify(element)), newObject ));
        });

        this.records = newRecords;
    }

    getRecordFieldValue(record, fieldName){
        return record[fieldName] === undefined ? '' :  record[fieldName]
    }

    handleOptionSelect(event) {

        this.selected = event.currentTarget.dataset.name;

        let detail = {   id: event.currentTarget.dataset.id, 
                        name: this.selected, 
                        record: this.recordById.get(event.currentTarget.dataset.id),
                        fieldLabel: this.fieldLabel
                    };
        this.dispatchCustomEvent( 'selected', detail );


        this.removeClass('.selectedOption', 'slds-hide');
        this.addClass('.defaultClass', 'slds-hide');
        this.addClass('.slds-combobox__form-element', 'slds-input-has-border_padding');

    }

    handleRemove() {

        this.removeSelectedOption();
    }

    handleGetOut(){
        if (this._timeoutKeyUp) clearTimeout(this._timeoutKeyUp);
        this._timeoutKeyUp = setTimeout(() => {
            this.addClass('.accounts_list', 'slds-hide');
            this.showRecordsListFlag = false;
        }, 300);
     }

     @api
     removeSelectedOption(){
        this.addClass('.selectedOption', 'slds-hide');
        this.removeClass('.slds-combobox__form-element', 'slds-input-has-border_padding');
        this.removeClass('.defaultClass', 'slds-hide');

        this.term = this.selected =  '';
        this.showRecordsListFlag = false;

        let detail = { objectName: this.objectName, name:'' };
        this.dispatchCustomEvent( 'remove', detail );
     }

     dispatchCustomEvent(envenName, detailObject ){
        this.dispatchEvent(new CustomEvent(envenName, {
            detail: detailObject
        }))
     }

     @api isValid(){
        
        if( this.selected == '' && this.isAttributeRequired) {
            this.addClass('[data-id=inputObj]', 'validity-field');
            this.addClass('.message-error', 'show-message-error'); 
            return false; 
        }
        else{
            this.removeClass('[data-id=inputObj]', 'validity-field');
            this.removeClass('.message-error', 'show-message-error');
            return true;
        }
     }

     addClass(field, cssClass){
        this.template
            .querySelector(field)
            .classList.add(cssClass);
     }

     removeClass(field, cssClass){
        this.template
            .querySelector(field)
            .classList.remove(cssClass); 
     }

    @api
    setDisabled(){
        this.isDisabled = true;
    }
}