import {
  parseData,
  formatPageQuery,
  formatPageQueryWithCount,
  formatGQLString,
  formatQuery,
  decodeId,
  pageInfo,
} from '@openimis/fe-core';

const INITIAL_STATE = {
  // Dashboards
  fetchingDashboards: false,
  fetchedDashboards: false,
  dashboards: [],
  dashboardsPageInfo: {},
  errorDashboards: null,
  
  currentDashboard: null,
  fetchingDashboard: false,
  fetchedDashboard: false,
  errorDashboard: null,
  
  // Queries
  fetchingQueries: false,
  fetchedQueries: false,
  queries: [],
  queriesPageInfo: {},
  errorQueries: null,
  
  currentQuery: null,
  fetchingQuery: false,
  fetchedQuery: false,
  errorQuery: null,
  
  // Query execution
  executingQuery: false,
  executedQuery: false,
  queryResults: null,
  queryError: null,
  
  // Entity fields
  fetchingEntityFields: false,
  fetchedEntityFields: false,
  entityFields: {},
  errorEntityFields: null,
  
  // Export
  exporting: false,
  exported: false,
  exportUrl: null,
  exportError: null,
  
  // Export history
  fetchingExports: false,
  fetchedExports: false,
  exports: [],
  exportsPageInfo: {},
  errorExports: null,
};

function reducer(
  state = INITIAL_STATE,
  action,
) {
  switch (action.type) {
    // Dashboards
    case 'ANALYTICS_DASHBOARDS_REQ':
      return {
        ...state,
        fetchingDashboards: true,
        fetchedDashboards: false,
        dashboards: [],
        dashboardsPageInfo: {},
        errorDashboards: null,
      };
    case 'ANALYTICS_DASHBOARDS_RESP':
      return {
        ...state,
        fetchingDashboards: false,
        fetchedDashboards: true,
        dashboards: parseData(action.payload.data.analyticsDashboards),
        dashboardsPageInfo: pageInfo(action.payload.data.analyticsDashboards),
        errorDashboards: null,
      };
    case 'ANALYTICS_DASHBOARDS_ERR':
      return {
        ...state,
        fetchingDashboards: false,
        errorDashboards: action.payload,
      };
      
    // Single Dashboard
    case 'ANALYTICS_DASHBOARD_REQ':
      return {
        ...state,
        fetchingDashboard: true,
        fetchedDashboard: false,
        currentDashboard: null,
        errorDashboard: null,
      };
    case 'ANALYTICS_DASHBOARD_RESP':
      return {
        ...state,
        fetchingDashboard: false,
        fetchedDashboard: true,
        currentDashboard: action.payload.data.analyticsDashboard,
        errorDashboard: null,
      };
    case 'ANALYTICS_DASHBOARD_ERR':
      return {
        ...state,
        fetchingDashboard: false,
        errorDashboard: action.payload,
      };
      
    // Queries
    case 'ANALYTICS_QUERIES_REQ':
      return {
        ...state,
        fetchingQueries: true,
        fetchedQueries: false,
        queries: [],
        queriesPageInfo: {},
        errorQueries: null,
      };
    case 'ANALYTICS_QUERIES_RESP':
      return {
        ...state,
        fetchingQueries: false,
        fetchedQueries: true,
        queries: parseData(action.payload.data.analyticsQueries),
        queriesPageInfo: pageInfo(action.payload.data.analyticsQueries),
        errorQueries: null,
      };
    case 'ANALYTICS_QUERIES_ERR':
      return {
        ...state,
        fetchingQueries: false,
        errorQueries: action.payload,
      };
      
    // Query execution
    case 'ANALYTICS_EXECUTE_QUERY_REQ':
      return {
        ...state,
        executingQuery: true,
        executedQuery: false,
        queryResults: null,
        queryError: null,
      };
    case 'ANALYTICS_EXECUTE_QUERY_RESP':
      return {
        ...state,
        executingQuery: false,
        executedQuery: true,
        queryResults: action.payload.data.executeAnalyticsQuery,
        queryError: null,
      };
    case 'ANALYTICS_EXECUTE_QUERY_ERR':
      return {
        ...state,
        executingQuery: false,
        queryError: action.payload,
      };
      
    // Entity fields
    case 'ANALYTICS_ENTITY_FIELDS_REQ':
      return {
        ...state,
        fetchingEntityFields: true,
        fetchedEntityFields: false,
        errorEntityFields: null,
      };
    case 'ANALYTICS_ENTITY_FIELDS_RESP':
      const entityType = action.meta.entityType;
      return {
        ...state,
        fetchingEntityFields: false,
        fetchedEntityFields: true,
        entityFields: {
          ...state.entityFields,
          [entityType]: action.payload.data.analyticsEntityFields,
        },
        errorEntityFields: null,
      };
    case 'ANALYTICS_ENTITY_FIELDS_ERR':
      return {
        ...state,
        fetchingEntityFields: false,
        errorEntityFields: action.payload,
      };
      
    // Export
    case 'ANALYTICS_EXPORT_REQ':
      return {
        ...state,
        exporting: true,
        exported: false,
        exportUrl: null,
        exportError: null,
      };
    case 'ANALYTICS_EXPORT_RESP':
      return {
        ...state,
        exporting: false,
        exported: true,
        exportUrl: action.payload.data.exportAnalyticsData.exportUrl,
        exportError: null,
      };
    case 'ANALYTICS_EXPORT_ERR':
      return {
        ...state,
        exporting: false,
        exportError: action.payload,
      };
      
    // Export history
    case 'ANALYTICS_EXPORTS_REQ':
      return {
        ...state,
        fetchingExports: true,
        fetchedExports: false,
        exports: [],
        exportsPageInfo: {},
        errorExports: null,
      };
    case 'ANALYTICS_EXPORTS_RESP':
      return {
        ...state,
        fetchingExports: false,
        fetchedExports: true,
        exports: parseData(action.payload.data.analyticsExports),
        exportsPageInfo: pageInfo(action.payload.data.analyticsExports),
        errorExports: null,
      };
    case 'ANALYTICS_EXPORTS_ERR':
      return {
        ...state,
        fetchingExports: false,
        errorExports: action.payload,
      };
      
    // Clear states
    case 'ANALYTICS_CLEAR_QUERY_RESULTS':
      return {
        ...state,
        executedQuery: false,
        queryResults: null,
        queryError: null,
      };
    case 'ANALYTICS_CLEAR_EXPORT':
      return {
        ...state,
        exported: false,
        exportUrl: null,
        exportError: null,
      };
      
    default:
      return state;
  }
}

export default reducer;