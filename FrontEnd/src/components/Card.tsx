import React from 'react';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';
import { makeStyles, Theme } from '@material-ui/core/styles';
import ScrollDialog from '@/components/Dialog';
import AumCard from '@/components/Aum'

function Alert(props: AlertProps) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const useStyles = makeStyles({
  root: {
    minWidth: '150px',
    maxWidth: 350,
    marginTop: 10,
    margin: 'auto',
    // margin: '10px',
    fontFamily: `'Avenir', Helvetica, Arial, sans-serif`,
  },
  media: {
    minHeight: '150px',
    height: 300,
  },
  center: {
    alignContent: 'center',
    alignItems: 'center',
  },
  Nor: {
    fontFamily: `Helvetica, Arial, sans-serif`,
  },
});

export default function MediaCard() {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const bull = <span className={classes.bullet}>•</span>;
  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  return (
    <div className={classes.center}>
      <Card className={classes.root}>
        <CardActionArea>
          <CardMedia
            className={classes.media}
            image="/images/nor.jpg"
            title="Nor"
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="h2">
              Aj{bull}Nor
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              His nickname from "Aj.Thanapon Noraset" who is teaching in Mahidol
              University
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <Button size="small" color="primary" onClick={handleClick}>
            Why AJ.Nor is a Great Teacher?
          </Button>
          <ScrollDialog />
        </CardActions>
      </Card>
      <Snackbar open={open} autoHideDuration={2500} onClose={handleClose}>
        <Alert onClose={handleClose} severity="warning" className={classes.Nor}>
          Because of Aj. Thanapon never said "หมงชาชา"
        </Alert>
      </Snackbar>

      <AumCard />
    </div>
    
  );
}
