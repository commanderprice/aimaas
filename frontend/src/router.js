import { createRouter, createWebHistory } from 'vue-router'
import SchemaCreate from "@/components/SchemaCreate.vue"
import Changes from "@/components/change_review/Changes";
import Entity from "@/components/Entity.vue"
import Schema from "@/components/Schema";
import SchemaList from "@/components/SchemaList";

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/createSchema',
            component: SchemaCreate,
            name: 'schema-new'
        },
        {
            path: '/schema/:schemaSlug',
            component: Schema,
            name: 'schema-view'
        },
        {
            path: '/schema/:schemaSlug/:entitySlug',
            component: Entity,
            name: 'entity-view'
        },
        {
          path: '/review',
          component: Changes,
          name: 'review-list'
        },
        {
            path: '/',
            component: SchemaList,
            name: 'schema-list'
        },
    ],
});