import React from 'react'
import ObjectView from '../views/object'
import {parse} from '../utils/path.js'
import i18n from '../utils/i18n.js'
import {Row, Col, Button} from 'react-bootstrap'
import {withIpfs} from '../components/ipfs'

class Objects extends React.Component {
  static displayName = 'Objects';
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };
  static propTypes = {
    gateway: React.PropTypes.string,
    params: React.PropTypes.object,
    ipfs: React.PropTypes.object
  };

  _getStateFromRoute = (props) => {
    const {params} = props
    let state = {}
    if (params.path) {
      const path = parse(params.path)
      state.path = path
      this._getObject(props, state.path)
      state.pathInput = path.toString()
    }
    // reset between reloads
    return state
  };

  _updateState = () => {
    this.setState(this._getStateFromRoute(this.props))
  };

  _getObject = (props, path) => {
    const p = path.toString().replace(/^\/ipfs\//, '')
    props.ipfs.object.get(p).then((object) => {
      this.setState({
        permalink: null,
        object
      })

      if (path.protocol === 'ipns') {
        // also resolve the name
        return props.ipfs.name.resolve(path.name).then((resolved) => {
          const permalink = parse(resolved.path).append(path.path)
          this.setState({
            permalink
          })
        })
      }
    }).catch((error) => this.setState({error}))
  };

  _update = (event) => {
    if (event.which && event.which !== 13) return
    const params = this.props.params
    params.path = parse(this.state.pathInput).urlify()

    const route = ['/objects']
    if (params.path) route.push(params.path)

    const r = route.join('/')
    if ('#' + r !== window.location.hash) {
      this.context.router.push(r)
    }
  };

  constructor (props) {
    super()
    this.state = this._getStateFromRoute(props)
  }

  componentDidMount () {
    this.mounted = true
    window.addEventListener('hashchange', this._updateState)
  }

  componentWillUnmount () {
    this.mounted = false
    window.removeEventListener('hashchange', this._updateState)
  }

  render () {
    const error = this.state.error ? (<div className='row'>
      <h4>{i18n.t('Error')}</h4>
      <div className='panel panel-default padded'>
        {this.state.error}
      </div>
    </div>) : null

    // TODO add provider-view here
    const views = (!error && this.state.object ? <div className='row'>
      <div className='col-xs-12'>
        <ObjectView
          object={this.state.object}
          path={this.state.path}
          permalink={this.state.permalink}
          gateway={this.props.gateway} />
      </div>
    </div> : null)

    return (
      <Row>
        <Col sm={10} smOffset={1} className={'webui-dag'}>
          <Row>
            <h4>{i18n.t('Enter hash or path')}</h4>
            <Row className='path'>
              <Col xs={10}>
                <input
                  type='text'
                  className='form-control input-lg'
                  onChange={(event) => this.setState({pathInput: event.target.value.trim()})}
                  onKeyPress={this._update}
                  value={this.state.pathInput}
                  placeholder={i18n.t('Enter hash or path: /ipfs/QmBpath...')} />
              </Col>
              <Col xs={2}>
                <Button bsStyle={'primary'} className={'go'}
                  onClick={this._update}>
                  {i18n.t('GO')}
                </Button>
              </Col>
            </Row>
          </Row>
          {error}
          {views}
        </Col>
      </Row>
    )
  }
}

export default withIpfs(Objects)
