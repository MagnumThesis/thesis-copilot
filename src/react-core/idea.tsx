export default class IdeaSidebarItem {
    title : string
    url : string
    isActive: boolean
    constructor(title : string, url : string, isActive=false){
        this.title = title,
        this.url = url,
        this.isActive = isActive
    }
}