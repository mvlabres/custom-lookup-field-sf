import LookupField from "./lookupField";

export default class SearchParameters {
    /**
     * @Type{String}
     */
    id;
    /**
     * @Type{String}
     */
    objectName;
    /**
     * @Type{[]}
     */
    returnFields;
    /**
     * @Type{[]}
     */
    queryFields;
    /**
     * @Type{String}
     */
    searchText;
    /**
     * @Type{String}
     */
    sortColumn;
    /**
     * @Type{String}
     */
    sortOrder;
    /**
     * @Type{Number}
     */
    maxResults;
    /**
     * @Type{String}
     */
    filter;
    /**
     * @Type{Object}
     */
    conditions;

    constructor(){
        this.id = null;
        this.objectName = null;
        this.returnFields = [];
        this.queryFields = [];
        this.searchText = null;
        this.sortColumn = null;
        this.sortOrder = null;
        this.maxResults = null;
        this.conditions = {};
    }
}
