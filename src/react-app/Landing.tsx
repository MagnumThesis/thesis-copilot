import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import IdeaSidebarItem from "@/react-core/idea";
import { useState } from "react";

const items = [new IdeaSidebarItem("Example Idea", "1"), new IdeaSidebarItem("Example Idea 2", "2")];

function Landing() {
  const [selectedIdea, setSelectedIdea] = useState(items[0]);

  

  return (
    <SidebarProvider>
      <AppSidebar items={items} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{selectedIdea.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Landing;
