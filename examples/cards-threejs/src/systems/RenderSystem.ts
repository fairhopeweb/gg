import { System, EntityManager, Entity } from '../../../../src/ecs'
import { Components } from '../components'
import { Archetypes } from '../archetypes'

export default class RenderSystem extends System<Components> {
  update(manager: EntityManager<Components>, dt: number) {
    const { entities } = manager.getArchetype(Archetypes.Renderable)

    entities.forEach(entity => {
      const position = entity.getComponent('position')
      const rotation = entity.getComponent('rotation')
      const mesh = entity.getComponent('mesh')
      mesh.position.set(position.x, position.y, position.z)
      mesh.rotation.set(rotation.x, rotation.y, rotation.z)
    })
  }
}
