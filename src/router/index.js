import Vue from 'vue'
import Router from 'vue-router'
import UserLocation from '@/pages/UserLocation'

Vue.use(Router)

export default new Router({
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('@/views/Home')
        },
        {
            path: '/user-location',
            name: 'user-location',
            component: UserLocation
        }
    ]
})