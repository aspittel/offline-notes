import './App.css'
import { useEffect, useState, useCallback } from 'react'

import { DataStore } from '@aws-amplify/datastore'
import { Note } from './models'

async function createNewNote () {
  try {
    return await DataStore.save(
      new Note({
        title: '',
        body: '',
        draft: true
      })
    )
  } catch (err) {
    console.error(err)
  }
}

function App () {
  const [note, setNote] = useState({})
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const autosave = useCallback(async () => {
    try {
      await DataStore.save(Note.copyOf(note, updatedNote => {
        updatedNote.title = title
        updatedNote.body = body
      }))
    } catch (err) {
      console.error(err)
    }
  }, [note, body, title])

  useEffect(() => {
    const getDraft = async () => {
      const noteStore = await DataStore.query(Note, note => note.draft('eq', true))
      if (noteStore.length === 0) {
        try {
          const newNote = await createNewNote()
          setNote(newNote)
        } catch (err) {
          console.error(err)
        }
      } else if (noteStore.length === 1) {
        setNote(noteStore[0])
        setTitle(noteStore[0].title)
        setBody(noteStore[0].body)
      } else {
        window.alert('there are multiple drafts, weird!')
      }
    }
    getDraft()
  }, [])

  useEffect(() => {
    window.addEventListener('beforeunload', autosave)

    return () => window.removeEventListener('beforeunload', autosave)
  }, [autosave])

  const saveNote = async () => {
    await DataStore.save(Note.copyOf(note, updatedNote => {
      updatedNote.title = title
      updatedNote.body = body
      updatedNote.draft = false
    }))
    const newNote = await createNewNote()
    setNote(newNote)
    setTitle('')
    setBody('')
  }

  return (
    <div className='App'>
      <h1>Notes!</h1>
      <form onSubmit={saveNote} className='create-form'>
        <input type='text' value={title} onChange={e => setTitle(e.target.value)} />
        <textarea cols='30' rows='10' onChange={e => setBody(e.target.value)} value={body} />
        <input type='submit' value='Create' />
      </form>
    </div>
  )
}

export default App
