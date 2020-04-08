import { ModelAlgebraRefined1 } from '@morphic-ts/model-algebras/lib/refined'
import { OrdURI } from '../hkt'

/**
 *  @since 0.0.1
 */
export const ordRefinedInterpreter: ModelAlgebraRefined1<OrdURI> = {
  _F: OrdURI,
  // TODO: add customize
  refined: getOrd => _config => getOrd
}
