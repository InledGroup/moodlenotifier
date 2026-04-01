export class Task {
    constructor({ id, name, course, dueDate, completed = false, url = '' }) {
        this.id = id;
        this.name = name;
        this.course = course;
        this.dueDate = dueDate;
        this.completed = completed;
        this.url = url;
    }

    toggle() {
        this.completed = !this.completed;
    }
}
