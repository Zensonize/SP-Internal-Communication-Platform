import moment from 'moment'
import 'moment/locale/th'

export default (ctx, inject) => {
  inject('moment', (dateTime = Date.now(), format = 'D MMM YY', addYear = 543) => moment(dateTime).add(addYear, 'addYear').format(format))
}