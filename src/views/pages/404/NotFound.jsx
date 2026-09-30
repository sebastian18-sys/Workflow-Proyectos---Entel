import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Link, NavLink } from "react-router";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-6">
                        {/* 404 Number */}
                        <div className="relative">
                            <h1 className="text-[12rem] md:text-[16rem] font-bold text-primary/10 select-none leading-none">404</h1>
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                        <h2 className="text-2xl font-semibold text-balance">Page Not Found</h2>
                            <p className="text-muted-foreground text-balance">
                                Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <Button asChild className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white">
                                <NavLink to="/home" className="flex items-center gap-2 text-sm">
                                    <Home className="w-4 h-4 mr-2" />
                                    Go Home
                                </NavLink>
                            </Button>
                        </div>

                    </div>
                </CardContent>
            </Card>
        </div>
    )
}