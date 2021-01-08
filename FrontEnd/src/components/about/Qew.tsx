import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';

import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';

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
    media: {
      minHeight: '250px',
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
        fontStyle: 'italic'
      },
      title: {
        fontSize: 14,
      },
   
  });

  
export default function Qew() {
    const classes = useStyles();

    return (
        <Card className={classes.root}>
        <CardActionArea>
          <CardMedia
            className={classes.media}
            image="/images/qew.jpg"
            title="Qew"
          />
          <CardContent>
          <Typography className={classes.title} color="textSecondary" gutterBottom>
          IOT Developer
        </Typography>
            <Typography gutterBottom variant="h5" component="h2">
              Qew
            </Typography>
            <Typography className={classes.pos} color="textSecondary">
          aka QewLegend
        </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              "Nattawat Lumtansawan" who is studying in Mahidol
              University, Computer Network Major
            </Typography>
          </CardContent>
        </CardActionArea>
        
      </Card> 
    )
}
