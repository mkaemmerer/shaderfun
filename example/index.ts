import { drawShader } from '../src'
import { program } from './taxicab-poly'

const canvas = document.querySelector('canvas') as HTMLCanvasElement
const gl = canvas.getContext('webgl')

const draw = drawShader(program)
window.addEventListener('resize', () => draw(gl))
draw(gl)
