import { ComponentTypes } from './Component'
import Entity from './Entity'

type ValueOf<T> = T[keyof T]

type ArchetypeComponentFilter<C extends ComponentTypes> = (
  ...componentTypes: (keyof C)[]
) => ArchetypeFilterPredicate<C>
type ArchetypeFilterPredicate<C extends ComponentTypes> = (
  entity: Entity<C>
) => boolean

type ArchetypeChangeEventTypes = 'add' | 'remove'

export interface ArchetypeChangeEvent<C extends ComponentTypes> {
  type: ArchetypeChangeEventTypes
  archetype: Archetype<C>
  entity: Entity<C>
  component: ValueOf<C> | undefined
}

export type ArchetypeChangeListener<C extends ComponentTypes> = (
  ev: ArchetypeChangeEvent<C>
) => void

export default class Archetype<C extends ComponentTypes> {
  static include = <CT extends ComponentTypes>(
    ...componentTypes: (keyof CT)[]
  ) => (entity: Entity<CT>) =>
    entity.hasComponents(...(componentTypes as string[]))

  static exclude = <CT extends ComponentTypes>(
    ...componentTypes: (keyof CT)[]
  ) => (entity: Entity<CT>) =>
    componentTypes.every(type => !entity.hasComponent(type as string))

  static only = <CT extends ComponentTypes>(
    ...componentTypes: (keyof CT)[]
  ) => (entity: Entity<CT>) =>
    componentTypes.length === entity.componentTypes.length &&
    entity.hasComponents(...(componentTypes as string[]))

  static any = <CT extends ComponentTypes>(...componentTypes: (keyof CT)[]) => (
    entity: Entity<CT>
  ) => componentTypes.some(type => entity.hasComponent(type as string))

  id: number

  filters: ArchetypeFilterPredicate<C>[]

  readonly entities: Entity<C>[] = []

  private onChangeListeners: Set<ArchetypeChangeListener<C>> = new Set()
  private onAddListeners: Set<ArchetypeChangeListener<C>> = new Set()
  private onRemoveListeners: Set<ArchetypeChangeListener<C>> = new Set()

  constructor(id: number, filters: ArchetypeFilterPredicate<C>[] = []) {
    this.id = id
    this.filters = filters
  }

  onChange(listener: ArchetypeChangeListener<C>) {
    this.onChangeListeners.add(listener)
    return () => this.onChangeListeners.delete(listener)
  }

  onAdd(listener: ArchetypeChangeListener<C>) {
    this.onAddListeners.add(listener)
    return () => this.onAddListeners.delete(listener)
  }

  onRemove(listener: ArchetypeChangeListener<C>) {
    this.onRemoveListeners.add(listener)
    return () => this.onRemoveListeners.delete(listener)
  }

  matchesEntity(entity: Entity<C>): boolean {
    return this.filters.every(filter => filter(entity))
  }

  hasEntity(entity: Entity<C>): boolean {
    return this.entities.indexOf(entity) !== -1
  }

  handleEntityChange(entity: Entity<C>, component?: ValueOf<C>) {
    if (this.hasEntity(entity)) {
      // Does this entity need to be removed
      if (!this.matchesEntity(entity)) {
        this.handleEntityRemove(entity, component)
      }
    } else {
      // Does this entity need to be added
      if (this.matchesEntity(entity)) {
        this.handleEntityAdd(entity, component)
      }
    }
  }

  handleEntityAdd(entity: Entity<C>, component?: ValueOf<C>) {
    if (this.matchesEntity(entity)) {
      if (!this.hasEntity(entity)) {
        const ev: ArchetypeChangeEvent<C> = {
          type: 'add',
          archetype: this,
          entity,
          component
        }

        this.entities.push(entity)
        this.onAddListeners.forEach(listener => listener(ev))
        this.onChangeListeners.forEach(listener => listener(ev))
      }
    }
  }

  handleEntityRemove(entity: Entity<C>, component?: ValueOf<C>) {
    if (this.hasEntity(entity)) {
      const idx = this.entities.indexOf(entity)

      if (idx !== -1) {
        const ev: ArchetypeChangeEvent<C> = {
          type: 'remove',
          archetype: this,
          entity,
          component
        }

        this.entities.splice(idx, 1)
        this.onRemoveListeners.forEach(listener => listener(ev))
        this.onChangeListeners.forEach(listener => listener(ev))
      }
    }
  }
}
