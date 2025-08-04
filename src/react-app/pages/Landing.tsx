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
import { useLocation, useNavigate } from "react-router-dom";

const items = [
  new IdeaSidebarItem("Example Idea", "1"),
  new IdeaSidebarItem("Example Idea 2", "2"),
];

function Landing() {
  const location = useLocation();
  const navigate = useNavigate();

  const item =
    items.find((item) => item.url == location.pathname.slice(1)) ||
    new IdeaSidebarItem("New", "");

  return (
    <SidebarProvider>
      <AppSidebar items={items} onNew={() => {navigate("/")}}/>
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
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        {item.url.length == 0 ? (
          <>
            <h1>Start a new Idea</h1>
          </>
        ) : (
          <></>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Landing;
