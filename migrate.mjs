import fs from 'fs';
import path from 'path';

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Handle next/navigation
            if (content.includes('useNavigate')) {
                content = content.replace(/import\s+\{[^}]*useNavigate[^}]*\}\s+from\s+['"]react-router-dom['"];?/g, "import { useRouter } from 'next/navigation';");
                content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\);/g, "const router = useRouter();");
                // Avoid replacing navigate(-1) with push
                content = content.replace(/navigate\(-1\)/g, "router.back()");
                content = content.replace(/navigate\(([^,]+)\)/g, "router.push($1)");
            }
            
            // Handle next/link
            if (content.includes('Link')) {
                content = content.replace(/import\s+\{\s*Link\s*\}\s+from\s+['"]react-router-dom['"];?/g, "import Link from 'next/link';");
                content = content.replace(/<Link\s+to=/g, "<Link href=");
                // For cases like import { Link, useNavigate } from 'react-router-dom'
                content = content.replace(/,\s*Link/g, "");
                content = content.replace(/Link,\s*/g, "");
            }
            
            // Handle Outlet in layout
            if (content.includes('Outlet')) {
                content = content.replace(/import\s+\{[^}]*Outlet[^}]*\}\s+from\s+['"]react-router-dom['"];?/g, "");
                content = content.replace(/<Outlet\s*\/>/g, "{children}");
            }

            // Remove leftover react-router-dom
            content = content.replace(/import\s+.*?\s+from\s+['"]react-router-dom['"];?\n?/g, "");

            // Prepend "use client" if it uses hooks
            if (content.includes('useState') || content.includes('useEffect') || content.includes('useRouter') || content.includes('useToast') || content.includes('useTheme') || content.includes('useQuery') || content.includes('onClick')) {
                if (!content.includes('"use client"') && !content.includes("'use client'") && !fullPath.includes('layout.tsx')) {
                    content = '"use client";\n\n' + content;
                }
            }
            
            // For dashboard layout, since it now has {children}, we need to ensure the component accepts it
            if (fullPath.includes('layout.tsx') && fullPath.includes('dashboard')) {
                content = content.replace(/const\s+Dashboard\s*=\s*\(\)\s*=>\s*\{/, "const Dashboard = ({ children }: { children: React.ReactNode }) => {");
            }
            
            // Default exports for Next.js pages
            if (fullPath.includes('page.tsx')) {
                // Ensure default export exists. If it's `export const X`, change to `export default function X`
                // But most of the files probably have `export default X;` at the end.
            }

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDirectory('./src');
