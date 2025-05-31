import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import { Avatar } from "@heroui/avatar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Ticket } from "lucide-react";

import { useAuth } from "@/context/authContext";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <HeroUINavbar maxWidth="xl" position="static">
      <NavbarBrand>
        <Link className="font-bold text-lg text-inherit" href="/">
          Ticketo
        </Link>
      </NavbarBrand>

      <NavbarContent justify="end">
        {user && !isAdmin && (
          <NavbarItem className="flex flex-row gap-4">
            <Button
              as={Link}
              className="flex items-center gap-2"
              color="primary"
              href="/my/tickets"
              variant="flat"
            >
              <Ticket size={18} />
              Мої квитки
            </Button>
          </NavbarItem>
        )}

        {user ? (
          <Dropdown>
            <DropdownTrigger>
              <div className="flex items-center space-x-3 cursor-pointer">
                <Avatar
                  isBordered
                  classNames={{ base: "border-2 border-primary-500" }}
                  color="primary"
                  name={user?.username}
                  radius="full"
                  size="sm"
                  src={
                    user?.username
                      ? `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`
                      : ""
                  }
                />
                <div className="hidden sm:block">
                  <p className="text-gray-800 font-semibold">
                    {user?.username}
                  </p>
                  {isAdmin ? (
                    <p className="text-sm text-gray-500">Адміністратор</p>
                  ) : (
                    <p className="text-sm text-gray-500">Кінофанат</p>
                  )}
                </div>
              </div>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem key="tickets" as={Link} href="/my/tickets">
                Мої квитки
              </DropdownItem>
              <DropdownItem key="divider" />
              <DropdownItem key="logout" color="primary" onPress={logout}>
                Вийти
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <>
            <NavbarItem className="hidden lg:flex">
              <Link href="/login">Вхід</Link>
            </NavbarItem>
            <NavbarItem>
              <Button as={Link} color="primary" href="/register" variant="flat">
                Реєстрація
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>
    </HeroUINavbar>
  );
};

export default Navbar;