import { Link } from 'react-router-dom'
import { wa } from '../../lib'
import Logo from '../home/Logo'

/* Slim footer for category / product pages */
export default function PageFooter() {
  return (
    <footer className="pfooter">
      <div className="mh-container pfooter__row">
        <Link to="/" className="nav__logo" aria-label="MOTO HUB home"><Logo /></Link>
        <p>eng/Hossam Abdelwhab</p>
        <a href="tel:01061921764" className="pfooter__phone">01061921764</a>
        <a href={wa('Hello MOTO HUB')} target="_blank" rel="noreferrer" className="wa-btn">WhatsApp</a>
      </div>
    </footer>
  )
}
