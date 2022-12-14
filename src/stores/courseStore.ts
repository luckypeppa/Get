import { deleteUndefinedPropertiesOfObject } from 'src/utils/objectUtils';
import { Course, CourseFieldsToChange } from './../types/course';
import { defineStore } from 'pinia';

export const useCourseStore = defineStore('course', {
  state: () => ({
    courses: [] as Course[],
  }),
  getters: {
    getCourseInfo: (state) => {
      return (courseId: string) =>
        state.courses.find((course) => course.id === courseId);
    },
  },
  actions: {
    setCourses(courses: Course[]) {
      this.courses = courses.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status > b.status ? 1 : -1;
        } else {
          return a.createdAt > b.createdAt ? 1 : -1;
        }
      });
    },
    addNewCourse(course: Course) {
      this.courses.unshift(course);
    },
    updateCourse(courseId: string, fields: CourseFieldsToChange) {
      const fieldsToChange = deleteUndefinedPropertiesOfObject(fields);
      this.courses.forEach((course) => {
        if (course.id === courseId) {
          Object.assign(course, fieldsToChange);
        }
      });
    },
    deleteCourse(courseId: string) {
      const index = this.courses.findIndex((course) => course.id === courseId);

      this.courses.splice(index, 1);
    },
  },
});
