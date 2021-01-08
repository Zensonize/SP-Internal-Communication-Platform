import React from 'react'
import Router from 'next/router'
import AppBarMD from '@material-ui/core/AppBar'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
// Little Idea from this 
const routes = [
  '/',
  '/chat',
  '/Profile',
  '/about'
]

// Shared State
let newIndex = 0
let lastIndex

class AppBar extends React.Component {
  handleChange = (event, index) => {
    lastIndex = newIndex
    newIndex = index
    Router.push(routes[index])
  };

  componentDidMount () {
    if (typeof lastIndex !== 'undefined') {
      setTimeout(() => {
        lastIndex = undefined
        this.forceUpdate()
      }, 0)
    }
  }

  render () {
    const index = typeof lastIndex === 'undefined'
      ? newIndex
      : lastIndex
    return (
      <AppBarMD position='static'>
        <Tabs index={index} onChange={this.handleChange}>
          {routes.map((route, index) => (
            <Tab key={index} label={route} />
          ))}
        </Tabs>
      </AppBarMD>
    )
  }
}

export default AppBar