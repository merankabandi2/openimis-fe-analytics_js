import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { useTranslations, useModulesManager } from '@openimis/fe-core';
import { toLocalDateString } from '../utils/analytics';

const FilterRow = ({ filter, fields, onChange, onRemove, className }) => {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('analytics', modulesManager);

  const selectedField = fields.find(f => f.name === filter.field);
  const fieldType = selectedField?.type || 'CharField';

  const handleFieldChange = (field) => {
    onChange({ ...filter, field, value: '' });
  };

  const handleOperatorChange = (operator) => {
    onChange({ ...filter, operator });
  };

  const handleValueChange = (value) => {
    onChange({ ...filter, value });
  };

  const getOperatorsForFieldType = (type) => {
    const textOperators = ['exact', 'ne', 'contains', 'startswith', 'endswith', 'isnull'];
    const numberOperators = ['exact', 'ne', 'gt', 'gte', 'lt', 'lte', 'isnull', 'range'];
    const dateOperators = ['exact', 'ne', 'gt', 'gte', 'lt', 'lte', 'isnull', 'range'];
    const booleanOperators = ['exact', 'ne', 'isnull'];

    switch (type) {
      case 'IntegerField':
      case 'DecimalField':
      case 'FloatField':
        return numberOperators;
      case 'DateField':
      case 'DateTimeField':
        return dateOperators;
      case 'BooleanField':
        return booleanOperators;
      default:
        return textOperators;
    }
  };

  const renderValueInput = () => {
    if (filter.operator === 'isnull') {
      return (
        <FormControlLabel
          control={
            <Switch
              checked={filter.value === true}
              onChange={(e) => handleValueChange(e.target.checked)}
            />
          }
          label={formatMessage('filter.isNull')}
        />
      );
    }

    if (filter.operator === 'range') {
      return (
        <Grid container spacing={1}>
          <Grid size={6}>
            <TextField
              variant="standard"
              label={formatMessage('filter.from')}
              value={filter.value?.[0] || ''}
              onChange={(e) => handleValueChange([e.target.value, filter.value?.[1] || ''])}
              fullWidth
              type={fieldType.includes('Integer') || fieldType.includes('Decimal') ? 'number' : 'text'} />
          </Grid>
          <Grid size={6}>
            <TextField
              variant="standard"
              label={formatMessage('filter.to')}
              value={filter.value?.[1] || ''}
              onChange={(e) => handleValueChange([filter.value?.[0] || '', e.target.value])}
              fullWidth
              type={fieldType.includes('Integer') || fieldType.includes('Decimal') ? 'number' : 'text'} />
          </Grid>
        </Grid>
      );
    }

    switch (fieldType) {
      case 'BooleanField':
        return (
          <FormControl variant="standard" fullWidth>
            <InputLabel>{formatMessage('filter.value')}</InputLabel>
            <Select
              variant="standard"
              value={filter.value || ''}
              onChange={(e) => handleValueChange(e.target.value)}>
              <MenuItem value={true}>{formatMessage('common.yes')}</MenuItem>
              <MenuItem value={false}>{formatMessage('common.no')}</MenuItem>
            </Select>
          </FormControl>
        );

      case 'DateField':
      case 'DateTimeField':
        return (
          <DatePicker
            label={formatMessage('filter.value')}
            value={filter.value || null}
            onChange={(date) => handleValueChange(toLocalDateString(date))}
            format="YYYY-MM-DD"
            fullWidth
          />
        );

      case 'IntegerField':
      case 'DecimalField':
      case 'FloatField':
        return (
          <TextField
            variant="standard"
            label={formatMessage('filter.value')}
            value={filter.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            type="number"
            fullWidth />
        );

      default:
        return (
          <TextField
            variant="standard"
            label={formatMessage('filter.value')}
            value={filter.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            fullWidth />
        );
    }
  };

  const availableOperators = getOperatorsForFieldType(fieldType);

  return (
    <Grid container spacing={2} alignItems="center" className={className}>
      <Grid
        size={{
          xs: 12,
          sm: 3
        }}>
        <FormControl variant="standard" fullWidth>
          <InputLabel>{formatMessage('filter.field')}</InputLabel>
          <Select
            variant="standard"
            value={filter.field || ''}
            onChange={(e) => handleFieldChange(e.target.value)}>
            {fields.filter(f => f.filterable).map((field) => (
              <MenuItem key={field.name} value={field.name}>
                {field.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 3
        }}>
        <FormControl variant="standard" fullWidth disabled={!filter.field}>
          <InputLabel>{formatMessage('filter.operator')}</InputLabel>
          <Select
            variant="standard"
            value={filter.operator || 'exact'}
            onChange={(e) => handleOperatorChange(e.target.value)}>
            {availableOperators.map((op) => (
              <MenuItem key={op} value={op}>
                {formatMessage(`filter.operator.${op}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 5
        }}>
        {filter.field && renderValueInput()}
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 1
        }}>
        <IconButton onClick={onRemove} size="small">
          <DeleteIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
};

export default FilterRow;