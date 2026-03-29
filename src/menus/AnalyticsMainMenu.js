import React from 'react';
import { FormattedMessage } from '@openimis/fe-core';
import { Dashboard, Assessment } from '@material-ui/icons';
import {
  RIGHT_ANALYTICS_VIEW,
  RIGHT_ANALYTICS_CREATE_QUERY,
  ANALYTICS_DASHBOARD_ROUTE,
  QUERY_BUILDER_ROUTE,
} from '../constants';

const AnalyticsMainMenu = (props) => {
  const { rights } = props;
  
  const menuItems = [];

  // Dashboard menu item
  if (rights.includes(RIGHT_ANALYTICS_VIEW)) {
    menuItems.push({
      text: <FormattedMessage module="analytics" id="menu.analytics.dashboard" />,
      icon: <Dashboard />,
      route: `/${ANALYTICS_DASHBOARD_ROUTE}`,
      priority: 1,
    });
  }

  // Query Builder menu item
  if (rights.includes(RIGHT_ANALYTICS_CREATE_QUERY)) {
    menuItems.push({
      text: <FormattedMessage module="analytics" id="menu.analytics.queryBuilder" />,
      icon: <Assessment />,
      route: `/${QUERY_BUILDER_ROUTE}`,
      priority: 2,
    });
  }

  return menuItems.sort((a, b) => a.priority - b.priority);
};

export default AnalyticsMainMenu;