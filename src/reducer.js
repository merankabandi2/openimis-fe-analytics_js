import { parseData, pageInfo } from '@openimis/fe-core';
import { graphqlErrorMessage, requestErrorMessage } from './utils/analytics';

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

  // Saved query create/update/delete
  savingQuery: false,
  saveQueryError: null,

  // Export
  exporting: false,
  exported: false,
  exportUrl: null,
  exportRowCount: null,
  exportError: null,

  // Export history
  fetchingExports: false,
  fetchedExports: false,
  exports: [],
  exportsPageInfo: {},
  errorExports: null,
};

// GraphQL refusals arrive as HTTP 200 (the _RESP action) with an `errors` array
// and null data; network and HTTP failures arrive as the _ERR action.
const responseError = (action) => graphqlErrorMessage(action.payload);
const responseData = (action, field) => (action.payload && action.payload.data ? action.payload.data[field] : null);

function reducer(state = INITIAL_STATE, action) {
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
    case 'ANALYTICS_DASHBOARDS_RESP': {
      const data = responseData(action, 'analyticsDashboards');
      return {
        ...state,
        fetchingDashboards: false,
        fetchedDashboards: true,
        dashboards: data ? parseData(data) : [],
        dashboardsPageInfo: data ? pageInfo(data) : {},
        errorDashboards: responseError(action),
      };
    }
    case 'ANALYTICS_DASHBOARDS_ERR':
      return {
        ...state,
        fetchingDashboards: false,
        errorDashboards: requestErrorMessage(action.payload),
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
        currentDashboard: responseData(action, 'analyticsDashboard'),
        errorDashboard: responseError(action),
      };
    case 'ANALYTICS_DASHBOARD_ERR':
      return {
        ...state,
        fetchingDashboard: false,
        errorDashboard: requestErrorMessage(action.payload),
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
    case 'ANALYTICS_QUERIES_RESP': {
      const data = responseData(action, 'analyticsQueries');
      return {
        ...state,
        fetchingQueries: false,
        fetchedQueries: true,
        queries: data ? parseData(data).filter(Boolean) : [],
        queriesPageInfo: data ? pageInfo(data) : {},
        errorQueries: responseError(action),
      };
    }
    case 'ANALYTICS_QUERIES_ERR':
      return {
        ...state,
        fetchingQueries: false,
        errorQueries: requestErrorMessage(action.payload),
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
        queryResults: responseData(action, 'executeAnalyticsQuery'),
        queryError: responseError(action),
      };
    case 'ANALYTICS_EXECUTE_QUERY_ERR':
      return {
        ...state,
        executingQuery: false,
        queryError: requestErrorMessage(action.payload),
      };

    // Entity fields
    case 'ANALYTICS_ENTITY_FIELDS_REQ':
      return {
        ...state,
        fetchingEntityFields: true,
        fetchedEntityFields: false,
        errorEntityFields: null,
      };
    case 'ANALYTICS_ENTITY_FIELDS_RESP': {
      const entityType = action.meta.entityType;
      return {
        ...state,
        fetchingEntityFields: false,
        fetchedEntityFields: true,
        entityFields: {
          ...state.entityFields,
          [entityType]: responseData(action, 'analyticsEntityFields') || [],
        },
        errorEntityFields: responseError(action),
      };
    }
    case 'ANALYTICS_ENTITY_FIELDS_ERR':
      return {
        ...state,
        fetchingEntityFields: false,
        errorEntityFields: requestErrorMessage(action.payload),
      };

    // Saved query create/update/delete
    case 'ANALYTICS_CREATE_QUERY_REQ':
    case 'ANALYTICS_UPDATE_QUERY_REQ':
    case 'ANALYTICS_DELETE_QUERY_REQ':
      return { ...state, savingQuery: true, saveQueryError: null };
    case 'ANALYTICS_CREATE_QUERY_RESP':
    case 'ANALYTICS_UPDATE_QUERY_RESP':
    case 'ANALYTICS_DELETE_QUERY_RESP':
      return { ...state, savingQuery: false, saveQueryError: responseError(action) };
    case 'ANALYTICS_CREATE_QUERY_ERR':
    case 'ANALYTICS_UPDATE_QUERY_ERR':
    case 'ANALYTICS_DELETE_QUERY_ERR':
      return { ...state, savingQuery: false, saveQueryError: requestErrorMessage(action.payload) };

    // Export
    case 'ANALYTICS_EXPORT_REQ':
      return {
        ...state,
        exporting: true,
        exported: false,
        exportUrl: null,
        exportRowCount: null,
        exportError: null,
      };
    case 'ANALYTICS_EXPORT_RESP': {
      const data = responseData(action, 'exportAnalyticsData');
      return {
        ...state,
        exporting: false,
        exported: Boolean(data),
        exportUrl: data ? data.exportUrl : null,
        exportRowCount: data ? data.rowCount : null,
        exportError: responseError(action),
      };
    }
    case 'ANALYTICS_EXPORT_ERR':
      return {
        ...state,
        exporting: false,
        exportError: requestErrorMessage(action.payload),
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
    case 'ANALYTICS_EXPORTS_RESP': {
      const data = responseData(action, 'analyticsExports');
      return {
        ...state,
        fetchingExports: false,
        fetchedExports: true,
        exports: data ? parseData(data) : [],
        exportsPageInfo: data ? pageInfo(data) : {},
        errorExports: responseError(action),
      };
    }
    case 'ANALYTICS_EXPORTS_ERR':
      return {
        ...state,
        fetchingExports: false,
        errorExports: requestErrorMessage(action.payload),
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
        exportRowCount: null,
        exportError: null,
      };

    default:
      return state;
  }
}

export default reducer;
