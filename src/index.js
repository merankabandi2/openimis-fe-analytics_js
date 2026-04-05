import React from 'react';
import { Dashboard, BarChart, SaveAlt, History } from '@material-ui/icons';
import { FormattedMessage } from '@openimis/fe-core';
import messages_en from './translations/en.json';
import messages_fr from './translations/fr.json';
import reducer from './reducer';
import AnalyticsMainMenu from './menus/AnalyticsMainMenu';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import QueryBuilderPage from './pages/QueryBuilderPage';
import SavedQueriesPage from './pages/SavedQueriesPage';
import ExportHistoryPage from './pages/ExportHistoryPage';
import {
  RIGHT_ANALYTICS_VIEW,
  RIGHT_ANALYTICS_CREATE_QUERY,
  RIGHT_ANALYTICS_EXPORT,
  ANALYTICS_DASHBOARD_ROUTE,
  QUERY_BUILDER_ROUTE,
  SAVED_QUERIES_ROUTE,
  EXPORT_HISTORY_ROUTE,
} from './constants';

const DEFAULT_CONFIG = {
  translations: [
    { key: 'en', messages: messages_en },
    { key: 'fr', messages: messages_fr }
  ],
  reducers: [{ key: 'analytics', reducer }],
  'core.MainMenu': [
    { name: 'AnalyticsMainMenu', component: AnalyticsMainMenu },
  ],
  'core.Router': [
    { path: ANALYTICS_DASHBOARD_ROUTE, component: AnalyticsDashboardPage },
    { path: QUERY_BUILDER_ROUTE, component: QueryBuilderPage },
    { path: SAVED_QUERIES_ROUTE, component: SavedQueriesPage },
    { path: EXPORT_HISTORY_ROUTE, component: ExportHistoryPage },
  ],
  refs: [
    { key: 'analytics.route.dashboard', ref: ANALYTICS_DASHBOARD_ROUTE },
    { key: 'analytics.route.queryBuilder', ref: QUERY_BUILDER_ROUTE },
    { key: 'analytics.route.savedQueries', ref: SAVED_QUERIES_ROUTE },
    { key: 'analytics.route.exportHistory', ref: EXPORT_HISTORY_ROUTE },
  ],
  'analytics.MainMenu': [
    {
      text: <FormattedMessage module="analytics" id="menu.analytics.dashboard" />,
      icon: <Dashboard />,
      route: `/${ANALYTICS_DASHBOARD_ROUTE}`,
      filter: (rights) => rights.includes(RIGHT_ANALYTICS_VIEW),
      id: 'analytics.dashboard',
    },
    {
      text: <FormattedMessage module="analytics" id="menu.analytics.queryBuilder" />,
      icon: <BarChart />,
      route: `/${QUERY_BUILDER_ROUTE}`,
      filter: (rights) => rights.includes(RIGHT_ANALYTICS_CREATE_QUERY),
      id: 'analytics.queryBuilder',
    },
    {
      text: <FormattedMessage module="analytics" id="menu.analytics.savedQueries" />,
      icon: <SaveAlt />,
      route: `/${SAVED_QUERIES_ROUTE}`,
      filter: (rights) => rights.includes(RIGHT_ANALYTICS_VIEW),
      id: 'analytics.savedQueries',
    },
    {
      text: <FormattedMessage module="analytics" id="menu.analytics.exportHistory" />,
      icon: <History />,
      route: `/${EXPORT_HISTORY_ROUTE}`,
      filter: (rights) => rights.includes(RIGHT_ANALYTICS_EXPORT),
      id: 'analytics.exportHistory',
    },
  ],
};

export const AnalyticsModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });