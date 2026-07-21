import {
  Link,
  useLocation,
} from "react-router-dom";


export default function AssessorBreadcrumbs({ items }) {

  const location = useLocation();


  /*
    FRONTEND HANDOFF

    Preserve workflow state when navigating
    backwards through breadcrumbs.

    This prevents losing:

    - selectedCourse
    - selectedTrainee
    - evaluationSummary
    - aiAnalysis
    - evaluationId

  */


  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-500">

      {items.map((item, index) => {


        const crumb =
          typeof item === "string"
            ? { label: item }
            : item;


        const isCurrent =
          index === items.length - 1;



        return (

          <span
            key={`${crumb.label}-${index}`}
            className="flex items-center gap-2"
          >


            {
              crumb.to && !isCurrent ? (

                <Link
                  to={crumb.to}

                  /*
                    IMPORTANT FIX

                    Keep previous navigation state
                    unless custom state is provided.
                  */

                  state={
                    crumb.state ??
                    location.state
                  }


                  className="
                    text-gray-500
                    underline-offset-4
                    hover:text-[#002f86]
                    hover:underline
                  "
                >

                  {crumb.label}

                </Link>


              ) : (

                <span
                  className={
                    isCurrent
                      ? "text-[#002f86]"
                      : "text-gray-500"
                  }
                >

                  {crumb.label}

                </span>

              )
            }



            {
              index < items.length - 1 && (

                <span className="text-gray-400">
                  &gt;
                </span>

              )
            }


          </span>

        );


      })}

    </nav>
  );
}