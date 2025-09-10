import { makeObservable, observable, action } from 'mobx';

/**
 * @class TestStore
 * @description A test store to verify MobX configuration
 */
export class TestStore {
  @observable public count = 0;

  constructor() {
    makeObservable(this);
  }

  @action.bound
  public increment(): void {
    this.count += 1;
  }

  @action.bound
  public decrement(): void {
    this.count -= 1;
  }

  @action.bound
  public reset(): void {
    this.count = 0;
  }
}
