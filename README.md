# openIMIS Frontend Analytics Module

This module provides self-service analytics capabilities for openIMIS, allowing users to visually query, filter, aggregate, and export data.

## Features

### Query Builder
- **Visual Interface**: Build complex queries without SQL knowledge
- **Entity Support**: Query data from Individuals, Groups, Beneficiaries, Payments, and Grievances
- **Advanced Filtering**: Multiple filter conditions with various operators
- **Field Selection**: Choose specific fields to include in results
- **Aggregations**: Support for COUNT, SUM, AVG, MIN, MAX operations
- **Grouping**: Group results by one or more fields
- **Live Preview**: See query results instantly

### Analytics Dashboard
- **Interactive Widgets**: Various visualization types including:
  - Metric cards for KPIs
  - Bar charts
  - Line charts
  - Pie charts
  - Data tables
- **Drag & Drop Layout**: Customize dashboard layout
- **Multiple Dashboards**: Switch between different dashboards
- **Real-time Updates**: Auto-refresh widget data

### Data Export
- **Multiple Formats**: Export to Excel, CSV, or PDF
- **Large Datasets**: Handle exports up to 100,000 rows
- **Export History**: Track all exports with download links
- **Formatted Output**: Professional formatting with headers and styling

### Saved Queries
- **Save for Later**: Save complex queries for reuse
- **Share Queries**: Make queries public for team collaboration
- **Query Management**: Edit, copy, or delete saved queries
- **Quick Actions**: Run saved queries with one click

## Installation

```bash
yarn add @openimis/fe-analytics
```

## Configuration

Add the module to your `openimis.json`:

```json
{
  "modules": [
    {
      "name": "AnalyticsModule",
      "npm": "@openimis/fe-analytics"
    }
  ]
}
```

## Permissions

The module uses the following permissions:
- `200001` - View analytics dashboards
- `200002` - Create and run custom queries
- `200003` - Export data
- `200004` - Create and save dashboards
- `200005` - Share dashboards and queries

## Usage

### Query Builder
1. Navigate to Analytics > Query Builder
2. Select an entity type (e.g., Beneficiaries)
3. Add filters to narrow down results
4. Select fields to display
5. Add aggregations if needed
6. Click "Run Query" to see results
7. Export or save the query for later use

### Dashboard
1. Navigate to Analytics > Dashboard
2. View default widgets and metrics
3. Switch between dashboards using the dropdown
4. Drag widgets to rearrange layout
5. Resize widgets as needed

### Creating Custom Widgets
Custom widgets can be created by:
1. Building a query in Query Builder
2. Saving the query
3. Adding it to a dashboard as a widget

## Development

### Project Structure
```
src/
├── components/          # Reusable components
│   ├── widgets/        # Dashboard widget components
│   ├── QueryBuilder.js # Main query builder component
│   └── ...
├── pages/              # Page components
├── actions.js          # Redux actions
├── reducer.js          # Redux reducer
├── constants.js        # Constants and configuration
└── translations/       # i18n translations
```

### Adding New Entity Types
To add support for new entity types:
1. Add the entity to `ENTITY_MODELS` in backend `services.py`
2. Add entity type to `ENTITY_TYPES` in frontend `constants.js`
3. Add translations for the entity name

### Creating Custom Widgets
To create a new widget type:
1. Create component in `src/components/widgets/`
2. Add widget type to `WIDGET_TYPES` in `constants.js`
3. Register in `AnalyticsDashboardPage` render method

## Dependencies

- React 17+
- Material-UI 4.x
- Recharts for data visualization
- React Grid Layout for dashboard layout
- xlsx for Excel export functionality

## Backend Requirements

This module requires the `openimis-be-analytics` backend module to be installed and configured.

## License

AGPL-3.0