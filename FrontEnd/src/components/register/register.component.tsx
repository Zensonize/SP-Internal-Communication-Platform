import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { IconButton, InputAdornment } from '@material-ui/core';
import { Visibility, VisibilityOff } from '@material-ui/icons';
export default function FormDialog() {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const handleRegister = () => {
    if (confirm('Your username and password are correct?')) {
      const getname = (document.getElementById('name') as HTMLInputElement)
        .value;
      const getpasswd = (document.getElementById(
        'password',
      ) as HTMLInputElement).value;
      console.log(getname, getpasswd);
      alert('Register successful!');
    } else {
      alert('Register unsuccessful!');
    }
    // alert("Register Completed!")
    setOpen(false);
  };

  const handleCancel = () => {
    confirm('Are you sure to cancel?');
    setOpen(false);
  };

  const checkpass = () => {
    const password = (document.getElementById('password') as HTMLInputElement)
      .value;
    const password_2 = (document.getElementById(
      'confirm-password',
    ) as HTMLInputElement).value;

    if (password == password_2) {
      document.getElementById('password').style.color = 'green';
      document.getElementById('confirm-password').style.color = 'green';
    } else {
      document.getElementById('password').style.color = 'red';
      document.getElementById('confirm-password').style.color = 'red';
    }
  };

  const [ShowPassword, setShowPassword] = useState(false);
  const handleClickedShowPassword = () => setShowPassword(!ShowPassword);
  const handleMouseDownPassword = () => setShowPassword(!ShowPassword);

  return (
    <div>
      <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Let's get started
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Join to MaChat</DialogTitle>
        <DialogContent>
          <DialogContentText>
            MaChat is required Username, and Password to identify each person.
          </DialogContentText>
          <TextField
            autoFocus
            // onKeyUp={checkusername}
            margin="dense"
            id="name"
            label="Name"
            type="text"
            fullWidth
            required
          />
          <TextField
            autoFocus
            onKeyUp={checkpass}
            margin="dense"
            id="password"
            label="Password"
            type={ShowPassword ? 'text' : 'Password'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickedShowPassword}
                    onMouseDown={handleMouseDownPassword}
                  >
                    {ShowPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            fullWidth
            required
          />
          <TextField
            autoFocus
            onKeyUp={checkpass}
            margin="dense"
            id="confirm-password"
            label="Password"
            type={ShowPassword ? 'text' : 'Password'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickedShowPassword}
                    onMouseDown={handleMouseDownPassword}
                  >
                    {ShowPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            fullWidth
            required
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleRegister} color="primary">
            Register
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
