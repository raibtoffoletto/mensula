import useCompactToolbar from '@hooks/use-compact-toolbar';
import Button, { type ButtonProps } from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

export type ToolbarButtonProps = Omit<ButtonProps, 'children' | 'startIcon' | 'endIcon'> & {
  icon: React.ReactNode;
  label: React.ReactNode;
};

/**
 * Toolbar button in the toolbar's muted color, shared by the filters, columns and export drop-ins:
 * a text button with a start icon, or below `md` an icon button with the label as its tooltip.
 */
const ToolbarButton = ({ icon, label, sx, ...props }: ToolbarButtonProps) => {
  const compact = useCompactToolbar();

  if (compact) {
    return (
      // A string tooltip title doubles as the button's accessible name, as in the stock toolbar.
      <Tooltip title={label}>
        <IconButton color="inherit" size="small" {...props} sx={sx}>
          {icon}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button
      color="inherit"
      startIcon={icon}
      {...props}
      sx={[{ textTransform: 'none' }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {label}
    </Button>
  );
};

export default ToolbarButton;
