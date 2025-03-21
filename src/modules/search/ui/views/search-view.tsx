import { CategoriesSection } from "../sections/categories-section";
import { ResultsSections } from "../sections/result-section";



interface SearchViewProps {
    query: string | undefined;
    categoryId: string | undefined;
};

export const SearchView = ({
    query,
    categoryId,
}: SearchViewProps) => {
    return (
        <div className="max-w-[1300px] mx-auto mb-10 flex flex-col gap-y-6 px-4 pt-2.5">
            <CategoriesSection categoryId={categoryId} />
            <ResultsSections query={query} categoryId={categoryId} />
        </div>
    );
};