import { useState } from "react";

import AssessmentInfo from "../../../../../components/admin/create-assessment/written-assessment/AssessmentInfo";

import QuestionList from "../../../../../components/admin/create-assessment/written-assessment/QuestionList";

import AddQuestionModal from "../../../../../components/admin/create-assessment/written-assessment/AddQuestionModal";

import {
  Plus,
  ArrowRight
} from "lucide-react";


export default function WrittenAssessmentBuilder({
  assessmentData,
  setAssessmentData,
  onNext
}) {


  const [openModal,setOpenModal] = useState(false);



  const questions = assessmentData.questions || [];




  const addQuestion = (question)=>{


    const updatedQuestions = [

      ...questions,

      {
        id: Date.now(),
        ...question
      }

    ];



    setAssessmentData({

      ...assessmentData,

      questions: updatedQuestions

    });



    setOpenModal(false);

  };





  const deleteQuestion=(id)=>{


    const updatedQuestions = questions.filter(
      q=>q.id !== id
    );



    setAssessmentData({

      ...assessmentData,

      questions: updatedQuestions

    });


  };





  return (

    <div className="space-y-6">



      {/* HEADER */}

      <div>


        <p className="
          text-gray-500
          mt-2
        ">
          Create assessment details and add questions.
        </p>


      </div>






      {/* ASSESSMENT INFORMATION */}

      <AssessmentInfo

        assessmentData={assessmentData}

        setAssessmentData={setAssessmentData}

      />








      {/* QUESTIONS HEADER */}

      <div className="
        flex
        justify-between
        items-center
      ">


        <h2 className="
          text-xl
          font-semibold
        ">

          Questions

        </h2>




        <button

          onClick={()=>setOpenModal(true)}

          className="
            flex
            items-center
            gap-2
            bg-blue-600
            text-white
            px-5
            py-3
            rounded-xl
            hover:bg-blue-700
          "

        >

          <Plus size={18}/>

          Add Question


        </button>



      </div>







      {/* QUESTION LIST */}

      <QuestionList

        questions={questions}

        onDelete={deleteQuestion}

      />








      {/* CONTINUE BUTTON */}

      <div className="
        flex
        justify-end
        pt-6
      ">


        <button

          onClick={onNext}

          className="
            flex
            items-center
            gap-2
            bg-[#001F5B]
            text-white
            px-6
            py-3
            rounded-xl
            hover:bg-blue-800
          "

        >

          Continue

          <ArrowRight size={18}/>


        </button>


      </div>








      {
        openModal &&

        <AddQuestionModal

          onClose={()=>
            setOpenModal(false)
          }

          onSave={addQuestion}

        />

      }





    </div>

  );

}