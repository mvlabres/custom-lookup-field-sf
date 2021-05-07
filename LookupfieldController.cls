public with sharing class LookupfieldController {

    private static Integer maxResults = 5;

    @AuraEnabled
    public static List<sObject> getRecentRecords( SearchParameters parameters ) {
        setMaxResult(parameters.maxResults);

        List<Id> recentIds = new List<Id>();
        for(RecentlyViewed recent : [SELECT Id FROM RecentlyViewed WHERE Type = :parameters.objectName ORDER BY LastViewedDate DESC LIMIT :maxResults]) {
            recentIds.add(recent.Id);
        }

        String query = getBaseQuery(parameters.returnFields);

        query += ' FROM ' + parameters.objectName + ' WHERE Id IN :recentIds';

        List<sObject> searchResult = Database.query(query);

        return searchResult;
    }

    @AuraEnabled
    public static List<sObject> searchRecords( SearchParameters parameters ) {
        setMaxResult(parameters.maxResults);

        String searchText = '%' + parameters.searchText + '%';
        List <sObject > returnList = new List < sObject > ();

        String query = getBaseQuery(parameters.returnFields);

        query += ' FROM ' + parameters.objectName + ' WHERE ';

        if (parameters.queryFields == null || parameters.queryFields.isEmpty()) {
            query += ' Name LIKE :searchText ';
        } else {
            string likeField = '';
            for(string field : parameters.queryFields) {
                likeField += ' OR ' + field + ' LIKE :searchText ';
            }
            query += ' (' + likeField.removeStart(' OR ') + ') ';
        }

        if ( !parameters.conditions.isEmpty() ) {
            query += buildConditions( parameters.conditions );
        }

        if(string.isNotBlank(parameters.sortColumn) && string.isNotBlank(parameters.sortOrder)) {
            query += ' ORDER BY ' + parameters.sortColumn + ' ' + parameters.sortOrder;
        }

        query += ' LIMIT ' + maxResults;

        List <sObject> searchResult = Database.query(query);

        return searchResult;
    }

    private static String buildConditions( Map<String,String> conditions ){
        String query = '';
        Set<String> keys = conditions.keySet();
        for ( String key : keys ) {
            query =+ ' AND ('+ key + ' = \'' + conditions.get(key) +'\') ';
        }
        return query;
    }

    @AuraEnabled
    public static List<sObject> getRecord( SearchParameters parameters ) {
        String id = parameters.id;
        String query = getBaseQuery(parameters.returnFields);

        query += ' FROM ' + parameters.objectName + ' WHERE Id = :id';

        List<sObject> searchResult = Database.query(query);

        return searchResult;
    }

    @AuraEnabled
    public static string findObjectIcon(String ObjectName) {
        String u;
        List<Schema.DescribeTabResult> tabDesc = new List<Schema.DescribeTabResult>();
        List<Schema.DescribeIconResult> iconDesc = new List<Schema.DescribeIconResult>();

        for(Schema.DescribeTabSetResult describeTabSetResult : Schema.describeTabs()) {
            for(Schema.DescribeTabResult describeTabResult : describeTabSetResult.getTabs()) {
                if(describeTabResult.getSobjectName() == ObjectName) { 
                    if( describeTabResult.isCustom() == true ) {
                        for (Schema.DescribeIconResult describeIcon : describeTabResult.getIcons()) {
                            if (describeIcon.getContentType() == 'image/svg+xml'){
                                return 'custom:' + describeIcon.getUrl().substringBetween('custom/','.svg').substringBefore('_');
                            }
                        }
                    } else {
                        return 'standard:' + ObjectName.toLowerCase();
                    }
                }
            }
        }
        return 'standard:default';
    }

    @AuraEnabled
    public static ObjectDetails getObjectDetails(String ObjectName) {

        ObjectDetails details = new ObjectDetails();

        Schema.DescribeSObjectResult describeSobjectsResult = Schema.describeSObjects(new List<String>{ObjectName})[0];
        details.label = describeSobjectsResult.getLabel();
        details.pluralLabel = describeSobjectsResult.getLabelPlural();
        details.iconName = findObjectIcon(ObjectName);

        return details;
    }

    private static void setMaxResult( Integer paramMaxResults ){
        if (paramMaxResults != null || paramMaxResults > 0) {
            maxResults = 5;
        }
    }

    private static String getBaseQuery( List<String> fields ){
        String baseQuery = 'SELECT Id, ';

        if ( fields != null && fields.Size() > 0 ) {
            baseQuery += String.join( fields, ',' );
        } else {
            baseQuery += 'Name';
        }

        return baseQuery;

    }

    public class ObjectDetails {
        @AuraEnabled
        public string iconName;
        @AuraEnabled
        public string label;
        @AuraEnabled
        public string pluralLabel;
    }

    public class SearchParameters {
        @AuraEnabled
        public String id {get; set;}
        @AuraEnabled
        public String objectName {get; set;}
        @AuraEnabled
        public List<String> returnFields {get; set;}
        @AuraEnabled
        public List<String> queryFields {get; set;}
        @AuraEnabled
        public String searchText {get; set;}
        @AuraEnabled
        public String sortColumn {get; set;}
        @AuraEnabled
        public String sortOrder {get; set;}
        @AuraEnabled
        public Integer maxResults {get; set;}
        @AuraEnabled
        public Map<String,String> conditions {get; set;}

        public searchParameters(){
            returnFields = new List<String>();
            queryFields = new List<String>();
            conditions = new Map<String,String>();
        }
    }
}
