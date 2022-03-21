import dayjs from 'dayjs'
import {
  Box,
  Button,
  Markdown,
  Text,
  Image,
  ThemeContext,
  Anchor,
} from 'grommet'
import { Episode, Source } from '../types'
import TurndownService from 'turndown'
import { Ascend, Descend, Checkmark } from 'grommet-icons'
import Launch from '../assets/launch.png'
import { useEffect, useRef, useState } from 'react'
import _ from 'lodash'
import { useAppDispatch } from '../store/hooks'
import { PAGE_SIZE } from '../store/constants'

const turndownService = new TurndownService()

function MarkAnchor(props: any) {
  let label = props.title
  if (!label) {
    if (props.children && typeof props.children[0] === 'string') {
      label = props.children[0]
    }
  }
  return <Anchor label={label} />
}

export default function EpisodeList({
  episodes,
  activeSource,
  activeItem,
  setActiveItem,
}: {
  episodes: Episode[]
  activeSource: Source | undefined
  activeItem: Episode | undefined
  setActiveItem: (digest: Episode | undefined) => void
}) {
  const [page, setPage] = useState(1)
  const [isAscend, setIsAscend] = useState(true)
  const dispatch = useAppDispatch()
  const listContainer = useRef(null)

  useEffect(() => {
    if (listContainer && listContainer.current) {
      ;(listContainer.current as any).scrollTo(0, 0)
    }
  }, [activeSource, isAscend])

  let _eposides = _.sortBy(episodes, [(t) => dayjs(t.pubDate).unix()])
  if (isAscend) {
    _eposides = _.reverse(_eposides)
  }

  _eposides = _eposides.slice(0, PAGE_SIZE * page)

  useEffect(() => {
    const callback = (e: KeyboardEvent) => {
      const index = _eposides.findIndex((t) => t.link === activeItem?.link)
      console.log(index)
      if (activeItem) {
        if (index >= 0) {
          if (e.code === 'ArrowRight' && index < _eposides.length - 1) {
            setActiveItem(_eposides[index + 1])
          }
          if (e.code === 'ArrowLeft' && index > 0) {
            setActiveItem(_eposides[index - 1])
          }
        }
      } else {
        setActiveItem(_eposides[0])
      }
    }
    document.addEventListener('keydown', callback)

    return () => {
      document.removeEventListener('keydown', callback)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_eposides])

  return (
    <ThemeContext.Consumer>
      {(theme: any) => {
        const isDark = theme.dark

        return (
          <Box width="300px" background={isDark ? 'dark-1' : 'light-1'}>
            <Box
              direction="row"
              height="40px"
              align="center"
              justify="between"
              background={isDark ? 'dark-1' : 'light-3'}
              pad={{ horizontal: 'small' }}
            >
              <Text size="small">
                <Text size="small" weight="bold" color="neutral-3">
                  {episodes.length}
                </Text>
                <Text size="small"> in total</Text>
              </Text>
              <Box direction="row" align="center">
                <Button
                  icon={isAscend ? <Descend /> : <Ascend />}
                  a11yTitle="Sort"
                  onClick={() => {
                    setIsAscend(!isAscend)
                  }}
                />
                <Button
                  icon={<Checkmark />}
                  a11yTitle="Read All"
                  onClick={() => {
                    dispatch({ type: 'item/readAll', payload: activeSource })
                  }}
                />
              </Box>
            </Box>

            {episodes.length === 0 ? (
              <Box height="100%" align="center" justify="end">
                <Image
                  src={Launch}
                  width="100px"
                  style={{ opacity: 0.7 }}
                  alt=""
                  className="launch-image"
                />
              </Box>
            ) : (
              <Box
                height="calc(100vh - 40px)"
                style={{ overflowY: 'scroll' }}
                ref={listContainer}
              >
                {_eposides.map((item, idx) => {
                  const digest = turndownService.turndown(
                    item?.description || ''
                  )
                  let isActive = false
                  if (item.guid) {
                    isActive = item.guid === activeItem?.guid
                  } else if (item.link) {
                    isActive = item.link === activeItem?.link
                  }
                  return (
                    <Box
                      key={`${item.title}-${idx}`}
                      pad={{ vertical: 'xsmall', horizontal: 'small' }}
                      style={{
                        minHeight: 'unset',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        opacity: item.readed ? 0.7 : 1,
                      }}
                      border={{
                        side: 'bottom',
                        size: 'xsmall',
                        color: 'light-4',
                      }}
                      background={isActive ? 'neutral-3' : ''}
                      onClick={() => setActiveItem(item)}
                    >
                      <Text size="small" weight="bolder">
                        {item.title}
                      </Text>
                      <Text size="xsmall" color="dark-6">
                        {dayjs(item.pubDate).format('YYYY-MM-DD HH:mm')}
                      </Text>
                      <Markdown
                        className="markdown-digest"
                        components={{ a: MarkAnchor }}
                      >
                        {digest}
                      </Markdown>
                    </Box>
                  )
                })}

                {episodes.length > PAGE_SIZE * page && (
                  <Box align="center" pad="small">
                    <Button
                      label="Load more"
                      primary
                      style={{ borderRadius: 0, background: '#000' }}
                      onClick={() => setPage(page + 1)}
                    />
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )
      }}
    </ThemeContext.Consumer>
  )
}
