export class List {
  _id: string;
  title: string;

  /* ownership fields – only one is ever set */
  _userId?: string;   // solo
  teamId?:  string;   // team

  constructor(_id: string = '', title: string = '') {
    this._id = _id;
    this.title = title;
  }
}

