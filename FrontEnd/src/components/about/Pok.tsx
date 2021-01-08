import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import React from 'react';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import { Filter } from '@material-ui/icons';

const useStyles = makeStyles({
    root: {
      minWidth: '50px',
      maxWidth: '250px',
      minHeight: '50px',
      marginTop: 10,
      margin: 'auto',
      // margin: '10px',
      fontFamily: `'Avenir', Helvetica, Arial, sans-serif`,
    },
    title: {
        fontSize: 14,
      },
    media: {
      minHeight: '50px',
      height: 300,
    },
    center: {
      alignContent: 'center',
      alignItems: 'center',
    },
    pos: {
        marginBottom: 6,
        marginTop: -10,
        fontSize: 10,
        fontStyle: 'italic',
        
      },
   
  });

  
  
export default function Pok() {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    const handleProfile = () => {
      // alert("You have have clicked")
      setOpen(true);
    };

    return (
        <Card className={classes.root}>
        <CardActionArea onClick={handleProfile}>
          <CardMedia
            className={classes.media}
            image="/images/pok.jpg"
            title="Pok"
          />
          <CardContent>
          <Typography className={classes.title} color="textSecondary" gutterBottom>
          Full Stack Developer
        </Typography>
            <Typography gutterBottom variant="h5" component="h2">
              Pok
            </Typography>
            <Typography className={classes.pos} color="textSecondary">
          aka ProtonFaker, SNP
        </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              "Sunat Praphanwong" who is studying in Mahidol
              University, Computer Science Major
            </Typography>
          </CardContent>
        </CardActionArea>
        
      </Card> 
    )
}
