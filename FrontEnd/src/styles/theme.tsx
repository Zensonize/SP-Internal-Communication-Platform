import { createMuiTheme } from '@material-ui/core/styles';
import { red } from '@material-ui/core/colors';

// Create a theme instance.
const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#fff',
    },
  },
});

const light = {
  body: '#FFF',
  text: '#363537',
  toggleBorder: '#FFF',
  background: '#E6E6E6',
  code: '#373737'
  
};

const dark = {
  body: '#363537',
  text: '#FAFAFA',
  toggleBorder: '#6B8096',
  background: '#2A2D2E',
  code: '#fafafa'
};

export const lightTheme = light;
export const darkTheme = dark;

export default theme;
