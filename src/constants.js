// Module name
export const MODULE_NAME = 'analytics';

// Rights/Permissions
export const RIGHT_ANALYTICS_VIEW = '200001';
export const RIGHT_ANALYTICS_CREATE_QUERY = '200002';
export const RIGHT_ANALYTICS_EXPORT = '200003';
export const RIGHT_ANALYTICS_CREATE_DASHBOARD = '200004';
export const RIGHT_ANALYTICS_SHARE = '200005';

// Routes
export const ANALYTICS_DASHBOARD_ROUTE = 'analytics/dashboard';
export const QUERY_BUILDER_ROUTE = 'analytics/query-builder';
export const SAVED_QUERIES_ROUTE = 'analytics/saved-queries';
export const EXPORT_HISTORY_ROUTE = 'analytics/export-history';

// Entity Types
export const ENTITY_TYPES = {
  INDIVIDUAL: 'individual',
  GROUP: 'group',
  BENEFICIARY: 'beneficiary',
  GROUP_BENEFICIARY: 'group_beneficiary',
  PAYMENT: 'payment',
  GRIEVANCE: 'grievance',
};

// Widget Types
export const WIDGET_TYPES = {
  BAR_CHART: 'bar_chart',
  LINE_CHART: 'line_chart',
  PIE_CHART: 'pie_chart',
  TABLE: 'table',
  METRIC: 'metric',
  MAP: 'map',
};

// Export Formats
export const EXPORT_FORMATS = {
  EXCEL: 'excel',
  CSV: 'csv',
  PDF: 'pdf',
};

// Aggregation Functions
export const AGGREGATION_FUNCTIONS = {
  COUNT: 'count',
  SUM: 'sum',
  AVG: 'avg',
  MIN: 'min',
  MAX: 'max',
};

// Filter Operators
export const FILTER_OPERATORS = {
  EQUALS: 'exact',
  NOT_EQUALS: 'ne',
  CONTAINS: 'contains',
  STARTS_WITH: 'startswith',
  ENDS_WITH: 'endswith',
  GREATER_THAN: 'gt',
  GREATER_THAN_OR_EQUALS: 'gte',
  LESS_THAN: 'lt',
  LESS_THAN_OR_EQUALS: 'lte',
  IN: 'in',
  NOT_IN: 'not_in',
  IS_NULL: 'isnull',
  IS_NOT_NULL: 'is_not_null',
  BETWEEN: 'range',
};

// Default values
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_DEBOUNCE_TIME = 500;
export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

// Chart colors
export const CHART_COLORS = [
  '#3366CC',
  '#DC3912',
  '#FF9900',
  '#109618',
  '#990099',
  '#3B3EAC',
  '#0099C6',
  '#DD4477',
  '#66AA00',
  '#B82E2E',
];

// Grid layout
export const GRID_COLS = 12;
export const GRID_ROW_HEIGHT = 100;
export const GRID_MARGIN = [10, 10];
export const GRID_CONTAINER_PADDING = [10, 10];