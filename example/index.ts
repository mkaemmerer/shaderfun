import { drawShader } from '../src'
import { program } from './chebyshev'

const canvas = document.querySelector('canvas') as HTMLCanvasElement
const gl = canvas.getContext('webgl')

const draw = drawShader(program)
window.addEventListener('resize', () => draw(gl))
draw(gl)
