export default class IdeaSidebarItem {
    title : string
    id : string
    isActive: boolean
    constructor(title : string, id : string, isActive=false){
        this.title = title,
        this.id = id,
        this.isActive = isActive
    }
}