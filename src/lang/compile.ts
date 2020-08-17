import { Expr } from './ast'
import { ShaderProgram, run } from './program'
import { print } from './print'
import { normalize } from './normalize'
import { TypeCol } from './types'

export const compile = (program: ShaderProgram): string => {
  const result: Expr<TypeCol> = run(program)
  const normalized = normalize(result)
  return print(normalized)
}
